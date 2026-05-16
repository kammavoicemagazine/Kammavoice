"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111111",
            border: "1px solid #2A2A2A",
            color: "#FAFAFA",
          },
        }}
        richColors
      />
    </AuthProvider>
  );
}
