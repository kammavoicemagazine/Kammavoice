import type { Metadata } from "next";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

export const metadata: Metadata = {
  title: "Kakatiya Pulse - Mobile App CMS Dashboard",
  robots: { index: false, follow: false },
};

export default function AppAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#050505] text-foreground font-sans antialiased selection:bg-gold selection:text-[#050505]">
        {children}
      </div>
    </ProtectedRoute>
  );
}
