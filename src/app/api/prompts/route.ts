import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as Record<string, unknown>).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, category, content, isDefault, sortOrder } = body;

    if (!name || !category || !content) {
      return NextResponse.json(
        { error: "Name, category, and content are required" },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.create({
      data: {
        name,
        category,
        content,
        isDefault: isDefault ?? false,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error("Failed to create prompt:", error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}
