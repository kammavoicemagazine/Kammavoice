import { create } from "zustand";

export interface DynamicIslandAlert {
  id: string;
  title: string;
  subtitle?: string;
  type: "breaking" | "general" | "success" | "error";
  progress?: number; // 0 to 100
  duration?: number; // ms to display
}

interface UIStore {
  // Dynamic Island
  activeAlert: DynamicIslandAlert | null;
  showAlert: (alert: Omit<DynamicIslandAlert, "id">) => void;
  dismissAlert: () => void;
}

export const useUIStore = create<UIStore>()((set, get) => ({
  // Dynamic Island State (Not persisted)
  activeAlert: null,
  showAlert: (alert) => {
    const id = Math.random().toString(36).substring(7);
    const newAlert = { ...alert, id };
    set({ activeAlert: newAlert });

    if (alert.duration !== 0) {
      const duration = alert.duration || 4000;
      setTimeout(() => {
        const currentAlert = get().activeAlert;
        if (currentAlert && currentAlert.id === id) {
          set({ activeAlert: null });
        }
      }, duration);
    }
  },
  dismissAlert: () => set({ activeAlert: null }),
}));
