"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useLang } from "./LanguageContext";
import { t, languages, LangCode } from "@/lib/i18n";

export default function Navbar() {
  const { data: session } = useSession();
  const { lang, setLang } = useLang();

  const user = session?.user as { role?: string } | undefined;
  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-white"
          >
            DueDiligence AI
          </Link>
          {session && (
            <div className="hidden items-center gap-4 sm:flex">
              <Link
                href="/dashboard"
                className="text-sm text-slate-300 transition-colors hover:text-white"
              >
                {t("app.dashboard", lang)}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm text-slate-300 transition-colors hover:text-white"
                >
                  {t("app.admin", lang)}
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LangCode)}
            className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(languages).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>

          {session ? (
            <button
              onClick={() => signOut()}
              className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600"
            >
              {t("app.logout", lang)}
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              {t("app.login", lang)}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
