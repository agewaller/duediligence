"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/components/LanguageContext";
import { t, languages, LangCode } from "@/lib/i18n";
import { aiModels } from "@/lib/ai-models";

interface Prompt {
  id: string;
  name: string;
  category: string;
}

interface Report {
  id: string;
  companyName: string;
  promptName: string;
  modelId: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { lang } = useLang();

  const [companyName, setCompanyName] = useState("");
  const [promptId, setPromptId] = useState("");
  const [modelId, setModelId] = useState(aiModels[0].id as string);
  const [reportLang, setReportLang] = useState<LangCode>(lang);
  const [context, setContext] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/prompts")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Prompt[]) => {
        setPrompts(data);
        if (data.length > 0) setPromptId(data[0].id);
      })
      .catch(() => {});

    fetch("/api/reports")
      .then((r) => (r.ok ? r.json() : []))
      .then(setReports)
      .catch(() => {});
  }, []);

  const runAnalysis = async () => {
    if (!companyName.trim() || !promptId) return;
    setRunning(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          promptId,
          modelId,
          language: reportLang,
          context: context.trim() || undefined,
        }),
      });
      if (res.ok) {
        const report = await res.json();
        router.push(`/reports/${report.id}`);
      }
    } finally {
      setRunning(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-white">
        {t("app.dashboard", lang)}
      </h1>

      {/* Analysis Form */}
      <div className="mb-12 rounded-xl border border-slate-700/50 bg-slate-800/50 p-8">
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            {t("app.company", lang)}
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t("app.company", lang)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {t("app.selectPrompt", lang)}
            </label>
            <select
              value={promptId}
              onChange={(e) => setPromptId(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {prompts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {t("app.selectModel", lang)}
            </label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {aiModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {t("app.selectLanguage", lang)}
            </label>
            <select
              value={reportLang}
              onChange={(e) => setReportLang(e.target.value as LangCode)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            Context
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t("app.contextPlaceholder", lang)}
            rows={3}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={runAnalysis}
          disabled={running || !companyName.trim()}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t("app.running", lang)}
            </span>
          ) : (
            t("app.run", lang)
          )}
        </button>
      </div>

      {/* Past Reports */}
      <h2 className="mb-4 text-xl font-semibold text-white">
        {t("app.reports", lang)}
      </h2>
      {reports.length === 0 ? (
        <p className="text-slate-500">No reports yet.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={`/reports/${report.id}`}
              className="block rounded-lg border border-slate-700/50 bg-slate-800/50 p-4 transition-colors hover:border-blue-500/30 hover:bg-slate-800"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">
                    {report.companyName}
                  </p>
                  <p className="text-sm text-slate-400">
                    {report.promptName} &middot; {report.modelId}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
