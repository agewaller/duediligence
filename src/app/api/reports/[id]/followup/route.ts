import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

async function getApiKeys() {
  const adminDb = getAdminDb();
  const snap = await adminDb.collection("ddSettings").doc("singleton").get();
  const settings = snap.exists ? snap.data() : null;
  return {
    anthropicApiKey: settings?.anthropicApiKey || process.env.ANTHROPIC_API_KEY || "",
    openaiApiKey: settings?.openaiApiKey || process.env.OPENAI_API_KEY || "",
    googleApiKey: settings?.googleApiKey || process.env.GOOGLE_AI_API_KEY || "",
    maxOutputTokens: settings?.maxOutputTokens || 16000,
  };
}

function getAIModel(
  aiModel: string,
  keys: { anthropicApiKey: string; openaiApiKey: string; googleApiKey: string }
) {
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
  if (aiModel.startsWith("gemini")) {
    if (!keys.googleApiKey) throw new Error("Google AI API key not configured");
    const google = createGoogleGenerativeAI({ apiKey: keys.googleApiKey });
    return google(aiModel);
  }
  throw new Error(`Unsupported AI model: ${aiModel}`);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { id } = await params;
    const adminDb = getAdminDb();

    const reportDoc = await adminDb.collection("ddReports").doc(id).get();
    if (!reportDoc.exists) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = reportDoc.data()!;
    if (report.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { query, context } = body;

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
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
    const aiModel = report.aiModel || report.modelId;
    const model = getAIModel(aiModel, keys);
    const result = await generateText({
      model,
      prompt: followUpPrompt,
      maxOutputTokens: keys.maxOutputTokens,
    });

    const followUpId = crypto.randomUUID();
    const followUpData = {
      reportId: id,
      query,
      context: context || null,
      response: result.text,
      createdAt: new Date().toISOString(),
    };
    await adminDb.collection("ddFollowUps").doc(followUpId).set(followUpData);

    return NextResponse.json({ id: followUpId, ...followUpData }, { status: 201 });
  } catch (error) {
    console.error("Follow-up analysis failed:", error);
    const message = error instanceof Error ? error.message : "Follow-up analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
