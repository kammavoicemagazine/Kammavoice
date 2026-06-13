"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Image as ImageIcon,
  Megaphone,
  FolderOpen,
  Settings,
  Cpu,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAdminStore } from "@/lib/admin-store";

interface NavGroup {
  label: string;
  roles: string[];
  items: {
    href: string;
    label: string;
    icon: any;
    badge?: string;
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    roles: ["Super Admin", "Editor", "Journalist", "Translator", "Moderator"],
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3, badge: "Live" },
    ],
  },
  {
    label: "Publishing",
    roles: ["Super Admin", "Editor", "Journalist", "Translator", "Moderator"],
    items: [
      { href: "/admin/magazines", label: "Magazines", icon: BookOpen },
      { href: "/admin/articles", label: "Articles", icon: FileText },
      { href: "/admin/news-queue", label: "News Queue", icon: FileText, badge: "Queue" },
      { href: "/admin/categories", label: "Categories", icon: FolderOpen },
    ],
  },
  {
    label: "AI & Ads",
    roles: ["Super Admin", "Editor", "Translator"],
    items: [
      { href: "/admin/ai-center", label: "AI Center", icon: Cpu, badge: "Gemini 1.5" },
      { href: "/admin/ads", label: "Advertisements", icon: Megaphone },
    ],
  },

  {
    label: "System",
    roles: ["Super Admin"],
    items: [
      { href: "/admin/users", label: "Users & Roles", icon: Users },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { role, sidebarCollapsed, setSidebarCollapsed } = useAdminStore();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      router.push("/admin-login");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // Filter groups based on current simulated role
  const filteredGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(() => group.roles.includes(role)),
  })).filter((group) => group.items.length > 0);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col bg-[#141414] border-r border-border-subtle shrink-0 select-none z-30"
    >
      {/* Logo & Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle h-16 bg-[#1A1A1A]">
        {!sidebarCollapsed && (
          <Link href="/admin" className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-[#0A0A0A] font-bold text-sm font-[family-name:var(--font-playfair)] shrink-0 shadow-lg shadow-gold/20">
              KV
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-gold-gradient font-[family-name:var(--font-playfair)] block truncate">
                KAMMA VOICE
              </span>
              <span className="text-[10px] text-muted uppercase font-mono tracking-widest block truncate">
                Media OS
              </span>
            </div>
          </Link>
        )}
        {sidebarCollapsed && (
          <Link href="/admin" className="mx-auto">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center text-[#0A0A0A] font-bold text-sm font-[family-name:var(--font-playfair)] shadow-lg shadow-gold/20">
              KV
            </div>
          </Link>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-all cursor-pointer shrink-0"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Badge */}
      {!sidebarCollapsed && (
        <div className="px-4 py-2.5 bg-[#1A1A1A]/50 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span className="text-xs font-medium text-foreground">{role}</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-border-subtle scrollbar-track-transparent">
        {filteredGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!sidebarCollapsed && (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/70 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative overflow-hidden ${
                      active
                        ? "text-gold bg-gold/10 border border-gold/20 shadow-lg shadow-gold/5"
                        : "text-muted hover:text-foreground hover:bg-surface-hover"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <item.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${active ? "text-gold" : "text-muted group-hover:text-foreground"}`} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                    {!sidebarCollapsed && item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
                        active ? "bg-gold text-[#0A0A0A]" : "bg-surface border border-border-subtle text-muted"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <motion.div
                        layoutId="activeSidebarIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gold"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-t border-border-subtle bg-[#1A1A1A]">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all cursor-pointer ${
            sidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
