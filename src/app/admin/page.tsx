"use client";

import { useAuth } from "@/components/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/lib/i18n";
import { aiModels } from "@/lib/ai-models";
import {
  getPrompts,
  getAllReports,
  getSiteSettings,
  updateSiteSettings,
  createPrompt,
  updatePrompt,
  deletePrompt as firestoreDeletePrompt,
  updateReport,
} from "@/lib/firestore";

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
  aiModel: string;
  isSample: boolean;
  createdAt: string;
}

interface Settings {
  defaultAiModel: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  maxOutputTokens: number;
  hasAnthropicKey: boolean;
  hasOpenaiKey: boolean;
  hasGoogleKey: boolean;
  googleApiKey: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { lang } = useLang();

  const [activeTab, setActiveTab] = useState<"settings" | "prompts" | "reports">("settings");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", category: "", content: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrompt, setNewPrompt] = useState({ name: "", category: "", content: "" });

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    defaultAiModel: "claude-sonnet-4-6",
    anthropicApiKey: "",
    openaiApiKey: "",
    maxOutputTokens: 16000,
    hasAnthropicKey: false,
    hasOpenaiKey: false,
    hasGoogleKey: false,
    googleApiKey: "",
  });
  const [newAnthropicKey, setNewAnthropicKey] = useState("");
  const [newOpenaiKey, setNewOpenaiKey] = useState("");
  const [newGoogleKey, setNewGoogleKey] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/auth/signin");
    if (!loading && user && user.role !== "admin") router.push("/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    getPrompts()
      .then((data) => setPrompts(data as Prompt[]))
      .catch(() => {});

    getAllReports()
      .then((data) => setReports(data as Report[]))
      .catch(() => {});

    getSiteSettings()
      .then((data) => {
        if (data) {
          const s = data as Record<string, unknown>;
          setSettings({
            defaultAiModel: (s.defaultAiModel as string) || "claude-sonnet-4-6",
            anthropicApiKey: s.anthropicApiKey ? String(s.anthropicApiKey).slice(0, 8) + "..." : "",
            openaiApiKey: s.openaiApiKey ? String(s.openaiApiKey).slice(0, 8) + "..." : "",
            googleApiKey: s.googleApiKey ? String(s.googleApiKey).slice(0, 8) + "..." : "",
            maxOutputTokens: (s.maxOutputTokens as number) || 16000,
            hasAnthropicKey: !!s.anthropicApiKey,
            hasOpenaiKey: !!s.openaiApiKey,
            hasGoogleKey: !!s.googleApiKey,
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const saveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMsg("");
    const body: Record<string, unknown> = {
      defaultAiModel: settings.defaultAiModel,
      maxOutputTokens: settings.maxOutputTokens,
    };
    if (newAnthropicKey) body.anthropicApiKey = newAnthropicKey;
    if (newOpenaiKey) body.openaiApiKey = newOpenaiKey;
    if (newGoogleKey) body.googleApiKey = newGoogleKey;

    try {
      await updateSiteSettings(body);
      // Refresh settings display
      const updated = await getSiteSettings();
      if (updated) {
        const s = updated as Record<string, unknown>;
        setSettings({
          defaultAiModel: (s.defaultAiModel as string) || "claude-sonnet-4-6",
          anthropicApiKey: s.anthropicApiKey ? String(s.anthropicApiKey).slice(0, 8) + "..." : "",
          openaiApiKey: s.openaiApiKey ? String(s.openaiApiKey).slice(0, 8) + "..." : "",
          googleApiKey: s.googleApiKey ? String(s.googleApiKey).slice(0, 8) + "..." : "",
          maxOutputTokens: (s.maxOutputTokens as number) || 16000,
          hasAnthropicKey: !!s.anthropicApiKey,
          hasOpenaiKey: !!s.openaiApiKey,
          hasGoogleKey: !!s.googleApiKey,
        });
      }
      setNewAnthropicKey("");
      setNewOpenaiKey("");
      setNewGoogleKey("");
      setSettingsMsg("Settings saved successfully");
    } catch {
      setSettingsMsg("Failed to save settings");
    }
    setSettingsSaving(false);
    setTimeout(() => setSettingsMsg(""), 3000);
  };

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setEditForm({ name: prompt.name, category: prompt.category, content: prompt.content });
  };

  const saveEdit = async (id: string) => {
    try {
      await updatePrompt(id, editForm);
      setPrompts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...editForm } : p))
      );
      setEditingId(null);
    } catch {
      // ignore
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await firestoreDeletePrompt(id);
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // ignore
    }
  };

  const addPrompt = async () => {
    if (!newPrompt.name || !newPrompt.content) return;
    try {
      const id = crypto.randomUUID();
      await createPrompt(id, newPrompt);
      setPrompts((prev) => [...prev, { id, ...newPrompt }]);
      setNewPrompt({ name: "", category: "", content: "" });
      setShowAddForm(false);
    } catch {
      // ignore
    }
  };

  const toggleSample = async (report: Report) => {
    try {
      await updateReport(report.id, { isSample: !report.isSample });
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, isSample: !r.isSample } : r
        )
      );
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const tabs = [
    { id: "settings" as const, label: "AI Settings" },
    { id: "prompts" as const, label: t("app.prompts", lang) },
    { id: "reports" as const, label: t("app.samples", lang) },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-white">
        {t("app.admin", lang)}
      </h1>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 rounded-xl bg-slate-800/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6">
            <h2 className="mb-6 text-lg font-semibold text-white">AI Model & API Keys</h2>

            {/* Default AI Model */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Default AI Model
              </label>
              <select
                value={settings.defaultAiModel}
                onChange={(e) => setSettings({ ...settings, defaultAiModel: e.target.value })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
              >
                {aiModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* Max Output Tokens */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Max Output Tokens
              </label>
              <input
                type="number"
                value={settings.maxOutputTokens}
                onChange={(e) => setSettings({ ...settings, maxOutputTokens: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none"
                min={1000}
                max={128000}
                step={1000}
              />
              <p className="mt-1 text-xs text-slate-500">1,000 ~ 128,000</p>
            </div>

            {/* Anthropic API Key */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Anthropic API Key
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  {settings.hasAnthropicKey && (
                    <p className="mb-2 text-xs text-green-400">
                      Current: {settings.anthropicApiKey}
                    </p>
                  )}
                  <input
                    type="password"
                    value={newAnthropicKey}
                    onChange={(e) => setNewAnthropicKey(e.target.value)}
                    placeholder={settings.hasAnthropicKey ? "Enter new key to replace..." : "sk-ant-..."}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {settings.hasAnthropicKey && (
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* OpenAI API Key */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                OpenAI API Key
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  {settings.hasOpenaiKey && (
                    <p className="mb-2 text-xs text-green-400">
                      Current: {settings.openaiApiKey}
                    </p>
                  )}
                  <input
                    type="password"
                    value={newOpenaiKey}
                    onChange={(e) => setNewOpenaiKey(e.target.value)}
                    placeholder={settings.hasOpenaiKey ? "Enter new key to replace..." : "sk-..."}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {settings.hasOpenaiKey && (
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Google AI API Key */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Google AI API Key (Gemini)
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  {settings.hasGoogleKey && (
                    <p className="mb-2 text-xs text-green-400">
                      Current: {settings.googleApiKey}
                    </p>
                  )}
                  <input
                    type="password"
                    value={newGoogleKey}
                    onChange={(e) => setNewGoogleKey(e.target.value)}
                    placeholder={settings.hasGoogleKey ? "Enter new key to replace..." : "AIza..."}
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                {settings.hasGoogleKey && (
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <button
                onClick={saveSettings}
                disabled={settingsSaving}
                className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {settingsSaving ? "Saving..." : t("app.save", lang)}
              </button>
              {settingsMsg && (
                <span className={`text-sm ${settingsMsg.includes("success") ? "text-green-400" : "text-red-400"}`}>
                  {settingsMsg}
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Prompts Tab */}
      {activeTab === "prompts" && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {t("app.prompts", lang)} ({prompts.length})
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
                <div
                  className="flex cursor-pointer items-center justify-between p-4"
                  onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform ${
                        expandedId === prompt.id ? "rotate-90" : ""
                      }`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
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
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="rounded px-3 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
                    >
                      {t("app.delete", lang)}
                    </button>
                  </div>
                </div>

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
      )}

      {/* Reports / Samples Tab */}
      {activeTab === "reports" && (
        <section>
          <h2 className="mb-6 text-lg font-semibold text-white">
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
                    {report.promptName} &middot; {report.aiModel} &middot;{" "}
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
      )}
    </div>
  );
}
