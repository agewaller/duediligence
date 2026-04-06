"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/lib/i18n";

interface SampleReport {
  id: string;
  companyName: string;
  promptName: string;
  modelId: string;
  createdAt: string;
}

export default function LandingClient() {
  const { lang } = useLang();
  const { data: session } = useSession();
  const [samples, setSamples] = useState<SampleReport[]>([]);

  useEffect(() => {
    fetch("/api/reports/samples")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSamples)
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            {t("landing.hero", lang)}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            {t("landing.desc", lang)}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href={session ? "/dashboard" : "/auth/signin"}
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/30"
            >
              {t("app.cta", lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            {t("app.features", lang)}
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                title: t("landing.feature1.title", lang),
                desc: t("landing.feature1.desc", lang),
                icon: (
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                ),
              },
              {
                title: t("landing.feature2.title", lang),
                desc: t("landing.feature2.desc", lang),
                icon: (
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                ),
              },
              {
                title: t("landing.feature3.title", lang),
                desc: t("landing.feature3.desc", lang),
                icon: (
                  <svg className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                ),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 transition-colors hover:border-blue-500/30 hover:bg-slate-800"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-md px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            {t("app.pricing", lang)}
          </h2>
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-10">
            <p className="text-5xl font-extrabold text-white">
              {t("app.price", lang)}
            </p>
            <p className="mt-2 text-slate-400">
              Unlimited due diligence reports
            </p>
            <Link
              href="/subscribe"
              className="mt-8 inline-block rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-blue-500"
            >
              {t("app.subscribe", lang)}
            </Link>
          </div>
        </div>
      </section>

      {/* Sample Reports */}
      {samples.length > 0 && (
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-2 text-center text-3xl font-bold text-white">
              {t("landing.samples.title", lang)}
            </h2>
            <p className="mb-12 text-center text-slate-400">
              {t("landing.samples.desc", lang)}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {samples.map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="group rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 transition-all hover:border-blue-500/30 hover:bg-slate-800"
                >
                  <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-blue-400">
                    {report.companyName}
                  </h3>
                  <p className="text-sm text-slate-400">{report.promptName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {report.modelId} &middot;{" "}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
