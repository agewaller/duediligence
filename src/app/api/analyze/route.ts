import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { languages, type LangCode } from "@/lib/i18n";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

function getAIModel(aiModel: string) {
  if (aiModel.startsWith("claude")) {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    return anthropic(aiModel);
  }

  if (aiModel.startsWith("gpt") || aiModel.startsWith("o")) {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    const languageName =
      languages[language as LangCode] || language;
    const now = new Date().toISOString().split("T")[0];

    const promptContent = prompt.content
      .replace(/\{\{COMPANY\}\}/g, companyName)
      .replace(/\{\{CONTEXT\}\}/g, context || "")
      .replace(/\{\{TIME_NOW\}\}/g, now)
      .replace(/\{\{LANGUAGE\}\}/g, languageName)
      .replace(/\{\{FIN_DATA\}\}/g, "");

    // Generate text using AI SDK
    const model = getAIModel(aiModel);
    const result = await generateText({
      model,
      prompt: promptContent,
      maxOutputTokens: 16000,
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
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
