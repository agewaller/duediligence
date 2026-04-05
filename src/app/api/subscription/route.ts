import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json({ status: "inactive", subscription: null });
    }

    const isActive =
      subscription.status === "active" &&
      subscription.currentPeriodEnd &&
      new Date(subscription.currentPeriodEnd) > new Date();

    return NextResponse.json({
      status: isActive ? "active" : "inactive",
      subscription,
    });
  } catch (error) {
    console.error("Failed to fetch subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
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

    const userId = (session.user as Record<string, unknown>).id as string;
    const body = await request.json();
    const { paypalSubId } = body;

    if (!paypalSubId) {
      return NextResponse.json(
        { error: "paypalSubId is required" },
        { status: 400 }
      );
    }

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        paypalSubId,
        status: "active",
        currentPeriodEnd,
      },
      create: {
        userId,
        paypalSubId,
        status: "active",
        currentPeriodEnd,
      },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
