import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { languages, type LangCode } from "@/lib/i18n";
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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || "";

    const adminDb = getAdminDb();

    // Check if admin to bypass subscription
    const userDoc = await adminDb.collection("ddUsers").doc(userId).get();
    const userRole = userDoc.exists ? userDoc.data()?.role : "user";

    if (userRole !== "admin") {
      const subDoc = await adminDb.collection("ddSubscriptions").doc(userId).get();
      const subscription = subDoc.exists ? subDoc.data() : null;
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
    }

    const body = await request.json();
    const { companyName, promptId, aiModel, language, context } = body;

    if (!companyName || !promptId || !aiModel || !language) {
      return NextResponse.json(
        { error: "companyName, promptId, aiModel, and language are required" },
        { status: 400 }
      );
    }

    const promptDoc = await adminDb.collection("ddPrompts").doc(promptId).get();
    if (!promptDoc.exists) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const prompt = promptDoc.data()!;
    const languageName = languages[language as LangCode] || language;
    const now = new Date().toISOString().split("T")[0];

    const promptContent = (prompt.content as string)
      .replace(/\{\{COMPANY\}\}/g, companyName)
      .replace(/\{\{CONTEXT\}\}/g, context || "")
      .replace(/\{\{TIME_NOW\}\}/g, now)
      .replace(/\{\{LANGUAGE\}\}/g, languageName)
      .replace(/\{\{FIN_DATA\}\}/g, "");

    const keys = await getApiKeys();
    const model = getAIModel(aiModel, keys);

    const result = await generateText({
      model,
      prompt: promptContent,
      maxOutputTokens: keys.maxOutputTokens,
    });

    const reportId = crypto.randomUUID();
    const reportData = {
      userId,
      userEmail,
      companyName,
      promptId: promptDoc.id,
      promptName: prompt.name,
      aiModel,
      content: result.text,
      language,
      isSample: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await adminDb.collection("ddReports").doc(reportId).set(reportData);

    return NextResponse.json({ id: reportId, ...reportData }, { status: 201 });
  } catch (error) {
    console.error("Analysis failed:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
