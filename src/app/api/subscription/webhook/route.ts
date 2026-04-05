import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_type, resource } = body;

    if (!event_type || !resource) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const paypalSubId = resource.id as string | undefined;

    if (!paypalSubId) {
      return NextResponse.json(
        { error: "Missing subscription ID in webhook" },
        { status: 400 }
      );
    }

    switch (event_type) {
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        await prisma.subscription.updateMany({
          where: { paypalSubId },
          data: {
            status: "active",
            currentPeriodEnd,
          },
        });
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        await prisma.subscription.updateMany({
          where: { paypalSubId },
          data: {
            status: "cancelled",
          },
        });
        break;
      }

      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        await prisma.subscription.updateMany({
          where: { paypalSubId },
          data: {
            status: "suspended",
          },
        });
        break;
      }

      case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
        await prisma.subscription.updateMany({
          where: { paypalSubId },
          data: {
            status: "past_due",
          },
        });
        break;
      }

      case "BILLING.SUBSCRIPTION.RE-ACTIVATED": {
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

        await prisma.subscription.updateMany({
          where: { paypalSubId },
          data: {
            status: "active",
            currentPeriodEnd,
          },
        });
        break;
      }

      default:
        console.log(`Unhandled PayPal webhook event: ${event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
