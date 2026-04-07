"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/lib/i18n";
import { getSubscription, upsertSubscription } from "@/lib/firestore";

interface Subscription {
  status: string;
  planId?: string;
  currentPeriodEnd?: string;
}

export default function SubscribePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { lang } = useLang();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/signin");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    getSubscription(user.uid)
      .then((data) => {
        setSubscription(data as Subscription | null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const handleApprove = async (data: { subscriptionID?: string | null }) => {
    if (!user) return;
    try {
      await upsertSubscription(user.uid, {
        subscriptionId: data.subscriptionID,
        status: "ACTIVE",
      });
      setSuccess(true);
      setSubscription({ status: "ACTIVE" });
    } catch {
      // ignore
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const isActive = subscription?.status === "ACTIVE";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-8 text-center text-3xl font-bold text-white">
        {t("app.subscribe", lang)}
      </h1>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 text-center">
        <p className="text-5xl font-extrabold text-white">$50</p>
        <p className="mt-1 text-slate-400">/ month</p>

        <ul className="mx-auto mt-8 max-w-xs space-y-3 text-left text-sm text-slate-300">
          <li className="flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Unlimited due diligence reports
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            All 10 DD analysis types
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Multiple AI models (Claude, GPT)
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Follow-up analysis & deep dives
          </li>
          <li className="flex items-center gap-2">
            <svg className="h-5 w-5 flex-shrink-0 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            8 languages supported
          </li>
        </ul>

        <div className="mt-8">
          {success ? (
            <div className="rounded-lg bg-green-600/20 p-4 text-green-400">
              Subscription activated successfully!
            </div>
          ) : isActive ? (
            <div className="space-y-2">
              <div className="rounded-lg bg-green-600/20 p-4 text-green-400">
                Active Subscription
              </div>
              {subscription?.currentPeriodEnd && (
                <p className="text-sm text-slate-500">
                  Renews: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-sm">
              <PayPalButtons
                style={{
                  shape: "rect",
                  color: "blue",
                  layout: "vertical",
                  label: "subscribe",
                }}
                createSubscription={(_data, actions) => {
                  return actions.subscription.create({
                    plan_id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "",
                  });
                }}
                onApprove={handleApprove}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
