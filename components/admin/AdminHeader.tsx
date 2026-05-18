"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Menu, ShieldCheck, Activity, CheckCircle2, AlertTriangle, X, Check } from "lucide-react";
import { useAdminStore, type AdminRole } from "@/lib/admin-store";

interface AdminHeaderProps {
  onMenuToggle?: () => void;
}

const ROLES: AdminRole[] = ["Super Admin", "Editor", "Journalist", "Translator", "Moderator"];

export default function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const {
    role,
    setRole,
    setCommandPaletteOpen,
    notifications,
    markNotificationAsRead,
    clearNotifications,
    systemHealth,
  } = useAdminStore();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="h-16 bg-[#141414] border-b border-border-subtle flex items-center justify-between px-4 lg:px-6 select-none z-20 sticky top-0 shadow-md">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-all cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Trigger Bar (Opens Command Palette) */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-3 px-3 py-2 w-72 rounded-xl bg-[#0A0A0A] border border-border-subtle hover:border-gold/40 text-sm text-muted hover:text-foreground transition-all cursor-pointer group shadow-inner"
        >
          <Search className="w-4 h-4 text-muted group-hover:text-gold transition-colors shrink-0" />
          <span className="flex-1 text-left truncate">Search Media OS...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border-subtle font-mono text-[10px] text-muted shrink-0 shadow-sm">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* System Health Status Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-border-subtle">
          <Activity className="w-4 h-4 text-gold animate-pulse" />
          <span className="text-xs font-semibold text-muted">System:</span>
          {systemHealth.cronStatus === "Healthy" ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">
              <AlertTriangle className="w-3.5 h-3.5" /> Warning
            </span>
          )}
        </div>

        {/* Role Selector Dropdown (Simulate Enterprise Permissions) */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-border-subtle hover:border-gold/40 transition-all cursor-pointer group shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
            <span className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors hidden sm:inline">
              {role}
            </span>
          </button>

          <AnimatePresence>
            {roleDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#141414] border border-border-subtle shadow-2xl py-1 z-50 overflow-hidden"
              >
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted border-b border-border-subtle bg-[#1A1A1A]">
                  Simulate Role
                </p>
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
                      role === r
                        ? "bg-gold/10 text-gold font-bold"
                        : "text-foreground hover:bg-surface-hover"
                    }`}
                  >
                    <span>{r}</span>
                    {role === r && <Check className="w-4 h-4 text-gold shrink-0" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl bg-[#0A0A0A] border border-border-subtle hover:border-gold/40 text-muted hover:text-foreground transition-all cursor-pointer shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold text-[#0A0A0A] text-[10px] font-extrabold flex items-center justify-center shadow-md shadow-gold/20 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#141414] border border-border-subtle shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-[#1A1A1A]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground font-[family-name:var(--font-playfair)]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-gold/20 text-gold text-xs font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-muted hover:text-danger transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-border-subtle/50 max-h-96">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center px-4">
                      <Bell className="w-8 h-8 text-muted mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-muted font-medium">No notifications</p>
                      <p className="text-xs text-muted/70 mt-1">You&quot;re all caught up with system alerts.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 transition-colors relative group ${
                          n.read ? "bg-transparent opacity-70" : "bg-gold/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-xs font-bold truncate ${n.read ? "text-foreground" : "text-gold"}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted shrink-0">{n.time}</span>
                        </div>
                        <p className="text-xs text-muted line-clamp-2 mb-2">{n.message}</p>
                        {!n.read && (
                          <button
                            onClick={() => markNotificationAsRead(n.id)}
                            className="text-[10px] font-semibold text-gold hover:underline cursor-pointer"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-border-subtle bg-[#1A1A1A] text-center">
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Admin Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-border-subtle">
          <div className="w-9 h-9 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold text-sm shadow-sm">
            A
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-foreground">Admin</p>
            <p className="text-[10px] text-muted truncate max-w-[120px]">admin@kammavoice.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}
