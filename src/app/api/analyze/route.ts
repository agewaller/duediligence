import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { languages, type LangCode } from "@/lib/i18n";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

async function getApiKeys() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  });
  return {
    anthropicApiKey: settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || "",
    openaiApiKey: settings?.openaiApiKey || process.env.OPENAI_API_KEY || "",
    maxOutputTokens: settings?.maxOutputTokens || 16000,
  };
}

function getAIModel(aiModel: string, keys: { anthropicApiKey: string; openaiApiKey: string }) {
  if (aiModel.startsWith("claude")) {
    if (!keys.anthropicApiKey) throw new Error("Anthropic API key not configured");
    const anthropic = createAnthropic({ apiKey: keys.anthropicApiKey });
    return anthropic(aiModel);
  }

  if (aiModel.startsWith("gpt") || aiModel.startsWith("o")) {
    if (!keys.openaiApiKey) throw new Error("OpenAI API key not configured");
    const openai = createOpenAI({ apiKey: keys.openaiApiKey });
    return openai(aiModel);
  }

  throw new Error(`Unsupported AI model: ${aiModel}`);
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    // Check active subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (
      !subscription ||
      subscription.status !== "active" ||
      (subscription.currentPeriodEnd &&
        new Date(subscription.currentPeriodEnd) < new Date())
    ) {
      return NextResponse.json(
        { error: "Active subscription required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { companyName, promptId, aiModel, language, context } = body;

    if (!companyName || !promptId || !aiModel || !language) {
      return NextResponse.json(
        { error: "companyName, promptId, aiModel, and language are required" },
        { status: 400 }
      );
    }

    // Load prompt
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Build the prompt content with template replacements
    const languageName = languages[language as LangCode] || language;
    const now = new Date().toISOString().split("T")[0];

    const promptContent = prompt.content
      .replace(/\{\{COMPANY\}\}/g, companyName)
      .replace(/\{\{CONTEXT\}\}/g, context || "")
      .replace(/\{\{TIME_NOW\}\}/g, now)
      .replace(/\{\{LANGUAGE\}\}/g, languageName)
      .replace(/\{\{FIN_DATA\}\}/g, "");

    // Get API keys from DB settings
    const keys = await getApiKeys();
    const model = getAIModel(aiModel, keys);

    const result = await generateText({
      model,
      prompt: promptContent,
      maxOutputTokens: keys.maxOutputTokens,
    });

    // Save report to DB
    const report = await prisma.report.create({
      data: {
        userId,
        companyName,
        promptId: prompt.id,
        promptName: prompt.name,
        aiModel,
        content: result.text,
        language,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Analysis failed:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
