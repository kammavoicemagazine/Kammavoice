import type { Metadata } from "next";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import CommandPalette from "@/components/admin/CommandPalette";

export const metadata: Metadata = {
  title: "Kamma Voice Media OS — Enterprise Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-[#0A0A0A] text-foreground font-sans antialiased selection:bg-gold selection:text-[#0A0A0A]">
        <CommandPalette />
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#0A0A0A]">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#0A0A0A] text-foreground scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
