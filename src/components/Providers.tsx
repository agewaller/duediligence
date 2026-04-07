"use client";

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { LangProvider } from "./LanguageContext";
import { AuthProvider } from "./AuthContext";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PayPalScriptProvider
        options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "placeholder",
          vault: true,
          intent: "subscription",
        }}
      >
        <LangProvider>{children}</LangProvider>
      </PayPalScriptProvider>
    </AuthProvider>
  );
}
