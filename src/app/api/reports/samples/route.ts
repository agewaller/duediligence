import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      where: { isSample: true },
      orderBy: { createdAt: "desc" },
      include: {
        followUps: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Failed to fetch sample reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch sample reports" },
      { status: 500 }
    );
  }
}
