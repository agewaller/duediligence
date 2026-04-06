"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LangCode, languages } from "@/lib/i18n";

interface LangContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
}

const LangContext = createContext<LangContextType>({
  lang: "ja",
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("ja");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lang") as LangCode | null;
    if (stored && stored in languages) {
      setLangState(stored);
    }
    setMounted(true);
  }, []);

  const setLang = (newLang: LangCode) => {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
