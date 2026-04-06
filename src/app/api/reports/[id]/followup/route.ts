import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const { id } = await params;

    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { query, context } = body;

    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    const followUpPrompt = [
      `The following is an existing due diligence report for ${report.companyName}:`,
      "",
      report.content,
      "",
      context ? `Additional context: ${context}` : "",
      "",
      `Follow-up question/instruction: ${query}`,
      "",
      "Please provide a detailed response based on the original report and the follow-up question above.",
    ].join("\n");

    const keys = await getApiKeys();
    const model = getAIModel(report.aiModel, keys);
    const result = await generateText({
      model,
      prompt: followUpPrompt,
      maxOutputTokens: keys.maxOutputTokens,
    });

    const followUp = await prisma.followUp.create({
      data: {
        reportId: id,
        query,
        context: context || null,
        response: result.text,
      },
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error("Follow-up analysis failed:", error);
    const message = error instanceof Error ? error.message : "Follow-up analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
