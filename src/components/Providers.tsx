"use client";

import { SessionProvider } from "next-auth/react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { LangProvider } from "./LanguageContext";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
          vault: true,
          intent: "subscription",
        }}
      >
        <LangProvider>{children}</LangProvider>
      </PayPalScriptProvider>
    </SessionProvider>
  );
}
