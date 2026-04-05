import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    // Load the original report
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

    // Build follow-up prompt with original report as context
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

    const model = getAIModel(report.aiModel);
    const result = await generateText({
      model,
      prompt: followUpPrompt,
      maxOutputTokens: 16000,
    });

    // Save follow-up
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
    return NextResponse.json(
      { error: "Follow-up analysis failed" },
      { status: 500 }
    );
  }
}
