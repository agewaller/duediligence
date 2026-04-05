"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/lib/i18n";

interface Prompt {
  id: string;
  name: string;
  category: string;
  content: string;
}

interface Report {
  id: string;
  companyName: string;
  promptName: string;
  modelId: string;
  isSample: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { lang } = useLang();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", content: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: "", category: "", content: "" });

  const user = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
    if (status === "authenticated" && user?.role !== "ADMIN") router.push("/dashboard");
  }, [status, user, router]);

  useEffect(() => {
    fetch("/api/prompts")
      .then((r) => (r.ok ? r.json() : []))
      .then(setPrompts)
      .catch(() => {});

    fetch("/api/reports?all=true")
      .then((r) => (r.ok ? r.json() : []))
      .then(setReports)
      .catch(() => {});
  }, []);

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setEditForm({ name: prompt.name, category: prompt.category, content: prompt.content });
  };

  const saveEdit = async (id: string) => {
    const res = await fetch(`/api/prompts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    }
  };

  const deletePrompt = async (id: string) => {
    const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const addPrompt = async () => {
    if (!newPrompt.name || !newPrompt.content) return;
    const res = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPrompt),
    });
    if (res.ok) {
      const created = await res.json();
      setPrompts((prev) => [...prev, created]);
      setNewPrompt({ name: "", category: "", content: "" });
      setShowAddForm(false);
    }
  };

  const toggleSample = async (report: Report) => {
    const res = await fetch(`/api/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isSample: !report.isSample }),
    });
    if (res.ok) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, isSample: !r.isSample } : r
        )
      );
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!session || user?.role !== "ADMIN") return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-white">
        {t("app.admin", lang)}
      </h1>

      {/* Prompts Section */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {t("app.prompts", lang)}
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            {t("app.add", lang)}
          </button>
        </div>

        {/* Add Prompt Form */}
        {showAddForm && (
          <div className="mb-6 rounded-xl border border-blue-500/30 bg-slate-800/50 p-6">
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                value={newPrompt.name}
                onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                placeholder="Prompt Name"
                className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={newPrompt.category}
                onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                placeholder="Category"
                className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <textarea
              value={newPrompt.content}
              onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
              placeholder="Prompt Content"
              rows={5}
              className="mb-4 w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={addPrompt}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                {t("app.save", lang)}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-600"
              >
                {t("app.cancel", lang)}
              </button>
            </div>
          </div>
        )}

        {/* Prompt List */}
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="rounded-xl border border-slate-700/50 bg-slate-800/50 transition-colors"
            >
              {/* Header */}
              <div
                className="flex cursor-pointer items-center justify-between p-4"
                onClick={() =>
                  setExpandedId(expandedId === prompt.id ? null : prompt.id)
                }
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      expandedId === prompt.id ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  <div>
                    <span className="font-medium text-white">{prompt.name}</span>
                    <span className="ml-3 rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                      {prompt.category}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => startEdit(prompt)}
                    className="rounded px-3 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-500/10"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePrompt(prompt.id)}
                    className="rounded px-3 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    {t("app.delete", lang)}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === prompt.id && (
                <div className="border-t border-slate-700/50 p-4">
                  {editingId === prompt.id ? (
                    <div>
                      <div className="mb-3 grid gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                          className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <textarea
                        value={editForm.content}
                        onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                        rows={8}
                        className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(prompt.id)}
                          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                        >
                          {t("app.save", lang)}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg bg-slate-700 px-4 py-1.5 text-sm text-slate-300 hover:bg-slate-600"
                        >
                          {t("app.cancel", lang)}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-slate-300">
                      {prompt.content}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Sample Reports Section */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">
          {t("app.samples", lang)}
        </h2>
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/50 p-4"
            >
              <div>
                <p className="font-medium text-white">{report.companyName}</p>
                <p className="text-sm text-slate-400">
                  {report.promptName} &middot; {report.modelId} &middot;{" "}
                  {new Date(report.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => toggleSample(report)}
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
            </div>
          ))}
          {reports.length === 0 && (
            <p className="text-slate-500">No reports found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
