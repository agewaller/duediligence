import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return false;
  const role = (session.user as Record<string, unknown>).role;
  return role === "admin";
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let settings = await prisma.siteSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {
          id: "singleton",
          defaultAiModel: "claude-sonnet-4-6",
          anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,
          openaiApiKey: process.env.OPENAI_API_KEY || null,
          maxOutputTokens: 16000,
        },
      });
    }

    return NextResponse.json({
      defaultAiModel: settings.defaultAiModel,
      anthropicApiKey: settings.anthropicApiKey ? maskKey(settings.anthropicApiKey) : "",
      openaiApiKey: settings.openaiApiKey ? maskKey(settings.openaiApiKey) : "",
      maxOutputTokens: settings.maxOutputTokens,
      hasAnthropicKey: !!settings.anthropicApiKey,
      hasOpenaiKey: !!settings.openaiApiKey,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { defaultAiModel, anthropicApiKey, openaiApiKey, maxOutputTokens } = body;

    const data: Record<string, unknown> = {};
    if (defaultAiModel !== undefined) data.defaultAiModel = defaultAiModel;
    if (anthropicApiKey !== undefined && anthropicApiKey !== "") data.anthropicApiKey = anthropicApiKey;
    if (openaiApiKey !== undefined && openaiApiKey !== "") data.openaiApiKey = openaiApiKey;
    if (maxOutputTokens !== undefined) data.maxOutputTokens = Number(maxOutputTokens);

    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: {
        id: "singleton",
        defaultAiModel: (data.defaultAiModel as string) || "claude-sonnet-4-6",
        anthropicApiKey: (data.anthropicApiKey as string) || null,
        openaiApiKey: (data.openaiApiKey as string) || null,
        maxOutputTokens: (data.maxOutputTokens as number) || 16000,
      },
    });

    return NextResponse.json({
      defaultAiModel: settings.defaultAiModel,
      anthropicApiKey: settings.anthropicApiKey ? maskKey(settings.anthropicApiKey) : "",
      openaiApiKey: settings.openaiApiKey ? maskKey(settings.openaiApiKey) : "",
      maxOutputTokens: settings.maxOutputTokens,
      hasAnthropicKey: !!settings.anthropicApiKey,
      hasOpenaiKey: !!settings.openaiApiKey,
    });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}
