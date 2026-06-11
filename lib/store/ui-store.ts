import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DynamicIslandAlert {
  id: string;
  title: string;
  subtitle?: string;
  type: "breaking" | "download" | "translation" | "general" | "success" | "error";
  progress?: number; // 0 to 100
  duration?: number; // ms to display
}

export interface OfflineMagazineMetadata {
  id: string;
  title: string;
  coverImageUrl: string;
  pdfUrl: string;
  volume: string;
  issueDate: string;
  localPdfPath?: string;
  localCoverPath?: string;
  fileSize?: string;
  downloadedAt?: string;
}

export interface DownloadState {
  magazineId: string;
  title: string;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  status: "idle" | "downloading" | "paused" | "completed" | "failed";
  error?: string;
  // Metadata for resuming after app restarts
  pdfUrl?: string;
  coverImageUrl?: string;
  volume?: string;
  issueDate?: string;
}

interface UIStore {
  // Dynamic Island
  activeAlert: DynamicIslandAlert | null;
  showAlert: (alert: Omit<DynamicIslandAlert, "id">) => void;
  dismissAlert: () => void;

  // Offline Downloads State
  downloads: Record<string, DownloadState>;
  downloadedMagazines: OfflineMagazineMetadata[];
  startDownload: (
    magazineId: string, 
    title: string, 
    pdfUrl: string, 
    coverImageUrl: string, 
    volume: string, 
    issueDate: string
  ) => void;
  updateDownload: (magazineId: string, updates: Partial<DownloadState>) => void;
  finishDownload: (magazineId: string, localMetadata: OfflineMagazineMetadata) => void;
  failDownload: (magazineId: string, error: string) => void;
  setDownloadedMagazines: (magazines: OfflineMagazineMetadata[]) => void;
  removeDownloadedMagazine: (magazineId: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
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

      // Downloads State (Persisted)
      downloads: {},
      downloadedMagazines: [],
      
      startDownload: (magazineId, title, pdfUrl, coverImageUrl, volume, issueDate) => 
        set((state) => ({
          downloads: {
            ...state.downloads,
            [magazineId]: {
              magazineId,
              title,
              progress: 0,
              downloadedBytes: 0,
              totalBytes: 0,
              status: "downloading",
              pdfUrl,
              coverImageUrl,
              volume,
              issueDate
            }
          }
        })),
        
      updateDownload: (magazineId, updates) => 
        set((state) => {
          const current = state.downloads[magazineId];
          if (!current) return {};
          
          const updated = { ...current, ...updates };
          
          // Sync to Dynamic Island if downloading
          let activeAlertUpdates = {};
          if (state.activeAlert && state.activeAlert.type === "download" && state.activeAlert.subtitle?.includes(current.title)) {
            activeAlertUpdates = {
              activeAlert: {
                ...state.activeAlert,
                progress: updated.progress,
                subtitle: `Downloading ${current.title} (${Math.round(updated.progress)}%)`,
              }
            };
          }

          return {
            downloads: {
              ...state.downloads,
              [magazineId]: updated,
            },
            ...activeAlertUpdates,
          };
        }),
        
      finishDownload: (magazineId, localMetadata) => 
        set((state) => {
          const updatedDownloads = { ...state.downloads };
          if (updatedDownloads[magazineId]) {
            updatedDownloads[magazineId].status = "completed";
            updatedDownloads[magazineId].progress = 100;
          }
          
          // Add to downloaded magazines list if not present
          const list = [...state.downloadedMagazines];
          const idx = list.findIndex(m => m.id === magazineId);
          if (idx > -1) {
            list[idx] = localMetadata;
          } else {
            list.push(localMetadata);
          }

          return {
            downloads: updatedDownloads,
            downloadedMagazines: list,
          };
        }),
        
      failDownload: (magazineId, error) => 
        set((state) => {
          const updatedDownloads = { ...state.downloads };
          if (updatedDownloads[magazineId]) {
            updatedDownloads[magazineId].status = "failed";
            updatedDownloads[magazineId].error = error;
          }
          return {
            downloads: updatedDownloads,
          };
        }),
        
      setDownloadedMagazines: (magazines) => set({ downloadedMagazines: magazines }),
      
      removeDownloadedMagazine: (magazineId) => 
        set((state) => {
          const updatedDownloads = { ...state.downloads };
          if (updatedDownloads[magazineId]) {
            updatedDownloads[magazineId].status = "idle";
            updatedDownloads[magazineId].progress = 0;
          }
          return {
            downloadedMagazines: state.downloadedMagazines.filter(m => m.id !== magazineId),
            downloads: updatedDownloads,
          };
        }),
    }),
    {
      name: "kv-app-downloads-state-v2",
      partialize: (state) => ({
        downloads: state.downloads,
        downloadedMagazines: state.downloadedMagazines,
      }),
    }
  )
);
