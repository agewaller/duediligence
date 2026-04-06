"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/lib/i18n";

interface FollowUp {
  id: string;
  query: string;
  response: string;
  createdAt: string;
}

interface Report {
  id: string;
  companyName: string;
  content: string;
  promptName: string;
  modelId: string;
  language: string;
  isSample: boolean;
  createdAt: string;
  followUps: FollowUp[];
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { lang } = useLang();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpContext, setFollowUpContext] = useState("");
  const [sending, setSending] = useState(false);

  const user = session?.user as { role?: string } | undefined;
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const toggleSample = async () => {
    if (!report) return;
    const res = await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSample: !report.isSample }),
    });
    if (res.ok) {
      setReport({ ...report, isSample: !report.isSample });
    }
  };

  const sendFollowUp = async () => {
    if (!followUpQuery.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/reports/${id}/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: followUpQuery.trim(),
          context: followUpContext.trim() || undefined,
        }),
      });
      if (res.ok) {
        const followUp = await res.json();
        setReport((prev) =>
          prev
            ? { ...prev, followUps: [...prev.followUps, followUp] }
            : prev
        );
        setFollowUpQuery("");
        setFollowUpContext("");
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-32 text-center text-slate-500">
        Report not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Metadata */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {report.companyName}
          </h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
            <span className="rounded bg-slate-800 px-2 py-0.5">
              {report.promptName}
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5">
              {report.modelId}
            </span>
            <span className="rounded bg-slate-800 px-2 py-0.5">
              {report.language}
            </span>
            <span>
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={toggleSample}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              report.isSample
                ? "bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {report.isSample
              ? t("app.removeSample", lang)
              : t("app.makeSample", lang)}
          </button>
        )}
      </div>

      {/* Report Content */}
      <div className="prose-dark mb-12 rounded-xl border border-slate-700/50 bg-slate-800/30 p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {report.content}
        </ReactMarkdown>
      </div>

      {/* Follow-up Responses */}
      {report.followUps.length > 0 && (
        <div className="mb-12 space-y-6">
          <h2 className="text-xl font-semibold text-white">
            {t("app.followup", lang)}
          </h2>
          {report.followUps.map((fu) => (
            <div
              key={fu.id}
              className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-6"
            >
              <p className="mb-3 text-sm font-medium text-blue-400">
                Q: {fu.query}
              </p>
              <div className="prose-dark">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {fu.response}
                </ReactMarkdown>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {new Date(fu.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Follow-up Form */}
      {session && (
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8">
          <h2 className="mb-4 text-xl font-semibold text-white">
            {t("app.followup", lang)}
          </h2>
          <div className="mb-4">
            <textarea
              value={followUpQuery}
              onChange={(e) => setFollowUpQuery(e.target.value)}
              placeholder={t("app.followupPlaceholder", lang)}
              rows={3}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <textarea
              value={followUpContext}
              onChange={(e) => setFollowUpContext(e.target.value)}
              placeholder={t("app.contextPlaceholder", lang)}
              rows={2}
              className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={sendFollowUp}
            disabled={sending || !followUpQuery.trim()}
            className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("app.running", lang)}
              </span>
            ) : (
              t("app.send", lang)
            )}
          </button>
        </div>
      )}
    </div>
  );
}
