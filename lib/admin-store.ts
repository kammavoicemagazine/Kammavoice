import { create } from "zustand";

export type AdminRole = "Super Admin" | "Editor" | "Journalist" | "Translator" | "Moderator";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
}

export interface SystemHealthMetrics {
  firestoreUsage: number; // percentage
  cloudinaryBandwidth: number; // percentage
  vercelFunctions: number; // percentage
  cronStatus: "Healthy" | "Warning" | "Error";
  apiLatencyMs: number;
  errorRatePercent: number;
}

interface AdminStoreState {
  role: AdminRole;
  setRole: (role: AdminRole) => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  
  notifications: AdminNotification[];
  addNotification: (notification: Omit<AdminNotification, "id" | "time" | "read">) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  aiPipelinePaused: boolean;
  setAiPipelinePaused: (paused: boolean) => void;
  
  systemHealth: SystemHealthMetrics;
  updateSystemHealth: (health: Partial<SystemHealthMetrics>) => void;
}

export const useAdminStore = create<AdminStoreState>((set) => ({
  role: "Super Admin",
  setRole: (role) => set({ role }),
  
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  
  notifications: [
    {
      id: "1",
      title: "AI Translation Completed",
      message: "Magazine 'Ugadi Special Edition' successfully translated to English, Kannada, and Tamil.",
      time: "10 mins ago",
      read: false,
      type: "success",
    },
    {
      id: "2",
      title: "High Traffic Alert",
      message: "Surge in visitors detected on article 'AP Elections 2026 Analysis'.",
      time: "1 hour ago",
      read: false,
      type: "info",
    },
    {
      id: "3",
      title: "System Health Warning",
      message: "Cloudinary bandwidth approaching 80% of monthly quota.",
      time: "3 hours ago",
      read: true,
      type: "warning",
    },
  ],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          id: Date.now().toString(),
          time: "Just now",
          read: false,
          ...notification,
        },
        ...state.notifications,
      ],
    })),
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  clearNotifications: () => set({ notifications: [] }),
  
  aiPipelinePaused: false,
  setAiPipelinePaused: (paused) => set({ aiPipelinePaused: paused }),
  
  systemHealth: {
    firestoreUsage: 42,
    cloudinaryBandwidth: 78,
    vercelFunctions: 29,
    cronStatus: "Healthy",
    apiLatencyMs: 145,
    errorRatePercent: 0.12,
  },
  updateSystemHealth: (health) =>
    set((state) => ({ systemHealth: { ...state.systemHealth, ...health } })),
}));
