import { Filesystem, Directory } from "@capacitor/filesystem";
import { App as CapApp } from "@capacitor/app";
import { Toast } from "@capacitor/toast";
import { Capacitor } from "@capacitor/core";
import { isNativePlatform } from "./capacitor-init";
import { useUIStore, OfflineMagazineMetadata } from "./store/ui-store";
import { triggerSuccessHaptic, triggerErrorHaptic, triggerLightTap } from "./haptic-utils";

const OFFLINE_STORAGE_KEY = "kv-downloaded-magazines";
const WEB_CACHE_NAME = "kv-magazine-offline-cache";
const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks
const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB app limit

// Active download controllers registry
interface ActiveDownloadJob {
  abortController: AbortController;
  status: "downloading" | "paused" | "canceled";
}
const activeJobs: Record<string, ActiveDownloadJob> = {};

/**
 * Show a native Toast notification if available, falling back to console
 */
export async function showToast(text: string): Promise<void> {
  try {
    await Toast.show({
      text,
      duration: "short",
      position: "bottom",
    });
  } catch (err) {
    console.log("[Toast Fallback]:", text);
  }
}

/**
 * Format bytes into human-readable string (e.g. 1.2 MB)
 */
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Convert ArrayBuffer to base64 string safely without stack overflows
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Get all downloaded magazines from localStorage metadata store.
 */
export function getOfflineMagazines(): OfflineMagazineMetadata[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("[OfflineMag] Failed to read downloaded list:", err);
    return [];
  }
}

/**
 * Save downloaded magazines metadata list to localStorage.
 */
function saveOfflineMagazinesList(list: OfflineMagazineMetadata[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error("[OfflineMag] Failed to save downloaded list:", err);
  }
}

/**
 * Check if a magazine is downloaded.
 */
export function isMagazineDownloaded(magazineId: string): boolean {
  const list = getOfflineMagazines();
  return list.some((item) => item.id === magazineId);
}

/**
 * Verify if the downloaded magazine files actually exist on the disk (native) or cache (web).
 * If they are missing, remove them from metadata and return false.
 */
export async function verifyOfflineMagazineExists(magazineId: string): Promise<boolean> {
  const list = getOfflineMagazines();
  const meta = list.find((m) => m.id === magazineId);
  if (!meta) return false;

  try {
    if (isNativePlatform) {
      if (!meta.localPdfPath) return false;
      const pdfFilename = meta.localPdfPath.substring(meta.localPdfPath.lastIndexOf("/") + 1);
      await Filesystem.stat({
        path: pdfFilename,
        directory: Directory.Data,
      });
      return true;
    } else {
      if (typeof window !== "undefined" && "caches" in window) {
        const cache = await caches.open(WEB_CACHE_NAME);
        const cachedResponse = await cache.match(meta.pdfUrl);
        return !!cachedResponse;
      }
    }
  } catch (err) {
    console.warn(`[OfflineMag] File verification failed for ${meta.title}, cleaning up:`, err);
    // Cleanup metadata since files are missing
    await deleteOfflineMagazine(magazineId);
  }
  return false;
}

/**
 * Calculate total storage used by downloaded magazines
 */
export function getTotalStorageUsed(): number {
  const list = getOfflineMagazines();
  return list.reduce((acc, curr) => {
    if (!curr.fileSize) return acc;
    const match = curr.fileSize.match(/([0-9.]+)\s*(MB|KB)/i);
    if (!match) return acc;
    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    return acc + (unit === "MB" ? value * 1024 * 1024 : value * 1024);
  }, 0);
}

/**
 * Download a magazine locally for offline reading (Resumable chunk-based downloader)
 */
export async function downloadMagazineOffline(
  magazineId: string,
  pdfUrl: string,
  title: string,
  coverImageUrl: string,
  volume: string,
  issueDate: string
): Promise<void> {
  const store = useUIStore.getState();
  
  // 1. Prevent duplicate concurrent downloads
  const activeJob = activeJobs[magazineId];
  if (activeJob && activeJob.status === "downloading") {
    showToast("Download already in progress");
    return;
  }

  store.startDownload(magazineId, title, pdfUrl, coverImageUrl, volume, issueDate);
  store.showAlert({
    title: "Download Started",
    subtitle: `Preparing ${title}...`,
    type: "download",
    progress: 0,
    duration: 3000
  });
  showToast(`Downloading ${title}`);

  try {
    let localPdfPath = "";
    let localCoverPath = "";
    let formattedSize = "Unknown Size";
    let totalBytes = 0;
    let downloadedBytes = 0;

    if (isNativePlatform) {
      // ─── NATIVE RESUMABLE CHUNK DOWNLOAD ─────────────────────────────
      const pdfFilename = `kv-mag-${magazineId}.pdf`;
      const coverFilename = `kv-cover-${magazineId}.jpg`;

      // A. Query file size to support resuming
      try {
        const fileStat = await Filesystem.stat({
          path: pdfFilename,
          directory: Directory.Data
        });
        downloadedBytes = fileStat.size;
        console.log(`[OfflineMag] Existing partial file found: ${downloadedBytes} bytes`);
      } catch {
        downloadedBytes = 0;
      }

      // B. Perform Range check & obtain total file size
      const checkResponse = await fetch(pdfUrl, {
        headers: { Range: "bytes=0-0" }
      });
      
      let supportsRange = checkResponse.status === 206;
      const contentRange = checkResponse.headers.get("content-range");
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match) totalBytes = parseInt(match[1], 10);
      }

      // Enforce allocated storage budget ceiling
      const currentStorageUsed = getTotalStorageUsed();
      if (currentStorageUsed + totalBytes > STORAGE_LIMIT_BYTES) {
        throw new Error("Insufficient space: 500MB allocation quota exceeded.");
      }

      if (supportsRange && totalBytes > 0) {
        console.log(`[OfflineMag] Resumable download active. Total: ${totalBytes} bytes`);

        // If completed already, check corruption
        if (downloadedBytes >= totalBytes && totalBytes > 0) {
          downloadedBytes = totalBytes;
        }

        // Setup active job
        const abortController = new AbortController();
        activeJobs[magazineId] = { abortController, status: "downloading" };

        let lastUpdateProgress = 0;
        let lastUpdateTime = 0;

        // Download loop
        while (downloadedBytes < totalBytes) {
          // Check if cancelled
          const currentJob = activeJobs[magazineId];
          if (!currentJob || currentJob.status === "canceled") {
            throw new Error("CANCELLED");
          }
          if (currentJob.status === "paused") {
            throw new Error("PAUSED");
          }

          const endByte = Math.min(totalBytes - 1, downloadedBytes + CHUNK_SIZE - 1);
          
          let buffer: ArrayBuffer | null = null;
          try {
            let retries = 0;
            const maxRetries = 3;
            let chunkFetched = false;

            while (retries < maxRetries && !chunkFetched) {
              try {
                const response = await fetch(pdfUrl, {
                  headers: { Range: `bytes=${downloadedBytes}-${endByte}` },
                  signal: abortController.signal
                });

                if (!response.ok && response.status !== 206) {
                  throw new Error(`HTTP ${response.status}`);
                }

                buffer = await response.arrayBuffer();
                chunkFetched = true;
              } catch (err: any) {
                if (err.name === "AbortError" || err.message === "CANCELLED" || err.message === "PAUSED") {
                  throw err;
                }
                retries++;
                if (retries >= maxRetries) {
                  throw err;
                }
                console.warn(`[OfflineMag] Chunk fetch failed (retry ${retries}/${maxRetries}):`, err);
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
              }
            }

            if (!buffer) {
              throw new Error("Failed to retrieve chunk buffer.");
            }

            // ─── CORRUPTION CHECK 1: Magic Header Signature ────────────
            if (downloadedBytes === 0) {
              const firstBytes = new Uint8Array(buffer.slice(0, 5));
              const header = String.fromCharCode(...firstBytes);
              if (header !== "%PDF-") {
                throw new Error("Corrupted PDF: Invalid magic signature header.");
              }
            }

            // ─── CORRUPTION CHECK 2: End-of-File Marker ────────────────
            if (downloadedBytes + buffer.byteLength >= totalBytes) {
              const lastBytes = new Uint8Array(buffer);
              const tail = String.fromCharCode(...lastBytes.slice(-120));
              if (!tail.includes("%%EOF")) {
                throw new Error("Corrupted PDF: Missing End-Of-File EOF token.");
              }
            }

            const base64Data = arrayBufferToBase64(buffer);

            // Write chunk to native disk
            try {
              if (downloadedBytes > 0) {
                await Filesystem.appendFile({
                  path: pdfFilename,
                  data: base64Data,
                  directory: Directory.Data
                });
              } else {
                await Filesystem.writeFile({
                  path: pdfFilename,
                  data: base64Data,
                  directory: Directory.Data
                });
              }
            } catch (writeErr: any) {
              const errMsg = writeErr.message || "";
              if (errMsg.includes("ENOSPC") || errMsg.includes("space") || errMsg.includes("full")) {
                throw new Error("Low Storage: Device storage full. Could not write chunk.");
              }
              throw writeErr;
            }

            downloadedBytes += buffer.byteLength;
            const progress = Math.min(100, (downloadedBytes / totalBytes) * 100);
            const now = Date.now();
            
            // Throttle to update only if progress increased by >= 1% or 250ms passed or completed
            if (progress - lastUpdateProgress >= 1 || now - lastUpdateTime >= 250 || downloadedBytes >= totalBytes) {
              store.updateDownload(magazineId, { progress, downloadedBytes, totalBytes });
              lastUpdateProgress = progress;
              lastUpdateTime = now;
            }
          } catch (fetchErr: any) {
            if (fetchErr.name === "AbortError") {
              const jobState = activeJobs[magazineId];
              if (jobState?.status === "paused") throw new Error("PAUSED");
              throw new Error("CANCELLED");
            }
            throw fetchErr;
          }
        }

        // Validate final file size against Content-Length
        if (isNativePlatform) {
          try {
            const fileStat = await Filesystem.stat({
              path: pdfFilename,
              directory: Directory.Data
            });
            if (fileStat.size !== totalBytes) {
              throw new Error(`Corrupted PDF: Mismatched size. Downloaded ${fileStat.size} of expected ${totalBytes} bytes.`);
            }
            console.log(`[OfflineMag] File size validation passed: ${fileStat.size} bytes.`);
          } catch (statErr: any) {
            console.error("[OfflineMag] Size validation check failed:", statErr);
            throw statErr;
          }
        }

        localPdfPath = (await Filesystem.getUri({ path: pdfFilename, directory: Directory.Data })).uri;
      } else {
        // Fallback: Non-resumable download in one block
        console.log("[OfflineMag] Server ranges not supported. Fallback to standard download.");
        const result = await Filesystem.downloadFile({
          url: pdfUrl,
          path: pdfFilename,
          directory: Directory.Data
        });
        localPdfPath = result.path || "";
      }

      // C. Handle Cover Image
      try {
        const coverResult = await Filesystem.downloadFile({
          url: coverImageUrl,
          path: coverFilename,
          directory: Directory.Data
        });
        localCoverPath = coverResult.path || "";
      } catch {
        localCoverPath = coverImageUrl;
      }

      formattedSize = formatBytes(totalBytes || downloadedBytes);
    } else {
      // ─── BROWSER CACHE STORAGE DOWNLOAD (WEB) ─────────────────────────
      if (!("caches" in window)) {
        throw new Error("Cache Storage API not supported.");
      }

      const cache = await caches.open(WEB_CACHE_NAME);
      const pdfRequest = new Request(pdfUrl, { mode: "cors" });
      const coverRequest = new Request(coverImageUrl, { mode: "cors" });

      const pdfResponse = await fetch(pdfRequest);
      if (!pdfResponse.ok) throw new Error("PDF download failed");

      const contentLength = pdfResponse.headers.get("content-length");
      totalBytes = contentLength ? parseInt(contentLength, 10) : 10000000;

      await cache.put(pdfRequest, pdfResponse.clone());
      formattedSize = formatBytes(totalBytes);
      store.updateDownload(magazineId, { progress: 80, downloadedBytes: 8000000, totalBytes });

      const coverResponse = await fetch(coverRequest);
      if (coverResponse.ok) {
        await cache.put(coverRequest, coverResponse);
      }

      localPdfPath = pdfUrl;
      localCoverPath = coverImageUrl;
    }

    // Persist local metadata
    const metadata: OfflineMagazineMetadata = {
      id: magazineId,
      title,
      coverImageUrl,
      pdfUrl,
      volume,
      issueDate,
      localPdfPath,
      localCoverPath,
      fileSize: formattedSize,
      downloadedAt: new Date().toISOString(),
    };

    const list = getOfflineMagazines();
    const filtered = list.filter((m) => m.id !== magazineId);
    filtered.push(metadata);
    saveOfflineMagazinesList(filtered);

    // Clean active job
    delete activeJobs[magazineId];

    store.updateDownload(magazineId, { progress: 100, status: "completed" });
    store.finishDownload(magazineId, metadata);
    triggerSuccessHaptic();

    store.showAlert({
      title: "Download Finished",
      subtitle: `${title} is ready offline.`,
      type: "success",
      duration: 4000
    });
    showToast(`${title} downloaded successfully`);
  } catch (err: any) {
    if (err.message === "PAUSED") {
      console.log(`[OfflineMag] Download paused: ${title}`);
      store.updateDownload(magazineId, { status: "paused" });
      showToast("Download paused");
      return;
    }

    if (err.message === "CANCELLED") {
      console.log(`[OfflineMag] Download cancelled: ${title}`);
      // Clean up partial file on native
      if (isNativePlatform) {
        try {
          await Filesystem.deleteFile({
            path: `kv-mag-${magazineId}.pdf`,
            directory: Directory.Data
          });
        } catch {}
      }
      store.updateDownload(magazineId, { status: "idle", progress: 0 });
      delete activeJobs[magazineId];
      showToast("Download cancelled");
      return;
    }

    // PDF CORRUPTION RECOVERY & EMERGENCY LOW-STORAGE PURGE: delete broken file
    if (err.message.includes("Corrupted") || err.message.includes("Invalid") || err.message.includes("Storage") || err.message.includes("Space")) {
      console.warn(`[OfflineMag] Purging temporary files due to failure: ${err.message}`);
      if (isNativePlatform) {
        try {
          await Filesystem.deleteFile({
            path: `kv-mag-${magazineId}.pdf`,
            directory: Directory.Data
          });
        } catch {}
      }
    }

    console.error("[OfflineMag] Download failed:", err);
    store.failDownload(magazineId, err.message || "Unknown error");
    delete activeJobs[magazineId];
    triggerErrorHaptic();

    store.showAlert({
      title: "Download Failed",
      subtitle: err.message || "An error occurred.",
      type: "error",
      duration: 5000
    });
    showToast(err.message.includes("Low Storage") ? "Storage full" : "Download failed");
  }
}

/**
 * Pause an active download
 */
export function pauseDownload(magazineId: string): void {
  const job = activeJobs[magazineId];
  if (job && job.status === "downloading") {
    job.status = "paused";
    job.abortController.abort();
    triggerLightTap();
  }
}

/**
 * Cancel and delete an active download
 */
export async function cancelDownload(magazineId: string): Promise<void> {
  const job = activeJobs[magazineId];
  const store = useUIStore.getState();
  triggerLightTap();

  if (job) {
    job.status = "canceled";
    job.abortController.abort();
  } else {
    // Delete partial files if no active job but exists in paused state
    if (isNativePlatform) {
      try {
        await Filesystem.deleteFile({
          path: `kv-mag-${magazineId}.pdf`,
          directory: Directory.Data
        });
      } catch {}
    }
    store.updateDownload(magazineId, { status: "idle", progress: 0 });
    showToast("Download cancelled");
  }
}

/**
 * Delete a completed offline magazine from the system
 */
export async function deleteOfflineMagazine(magazineId: string): Promise<void> {
  const store = useUIStore.getState();
  const list = getOfflineMagazines();
  const item = list.find((m) => m.id === magazineId);

  if (!item) return;

  try {
    if (isNativePlatform) {
      // 1. Delete PDF file
      if (item.localPdfPath) {
        try {
          const pdfFilename = item.localPdfPath.substring(item.localPdfPath.lastIndexOf("/") + 1);
          await Filesystem.deleteFile({
            path: pdfFilename,
            directory: Directory.Data,
          });
        } catch (err) {
          console.warn("[OfflineMag] Failed to delete local PDF file:", err);
        }
      }

      // 2. Delete Cover file
      if (item.localCoverPath && item.localCoverPath.includes("kv-cover-")) {
        try {
          const coverFilename = item.localCoverPath.substring(item.localCoverPath.lastIndexOf("/") + 1);
          await Filesystem.deleteFile({
            path: coverFilename,
            directory: Directory.Data,
          });
        } catch (err) {
          console.warn("[OfflineMag] Failed to delete local cover file:", err);
        }
      }
    } else {
      // Delete from Web Cache
      if (typeof window !== "undefined" && "caches" in window) {
        const cache = await caches.open(WEB_CACHE_NAME);
        await cache.delete(item.pdfUrl);
        await cache.delete(item.coverImageUrl);
      }
    }

    // Save updated metadata list
    const updatedList = list.filter((m) => m.id !== magazineId);
    saveOfflineMagazinesList(updatedList);
    store.removeDownloadedMagazine(magazineId);
    
    store.showAlert({
      title: "Magazine Removed",
      subtitle: `${item.title} has been deleted.`,
      type: "general",
      duration: 3000
    });
    showToast(`${item.title} removed`);
  } catch (err) {
    console.error("[OfflineMag] Failed to delete magazine:", err);
    triggerErrorHaptic();
  }
}

/**
 * Get a local URL usable in web views (canvas rendering/object URL)
 * for a downloaded magazine PDF.
 */
export async function getLocalPdfUrl(metadata: OfflineMagazineMetadata): Promise<string> {
  if (isNativePlatform && metadata.localPdfPath) {
    const rawPath = metadata.localPdfPath.startsWith("file://")
      ? metadata.localPdfPath
      : `file://${metadata.localPdfPath}`;
    return Capacitor.convertFileSrc(rawPath);
  }

  // Web fallback: read from Cache Storage and return Object URL
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(WEB_CACHE_NAME);
      const cachedResponse = await cache.match(metadata.pdfUrl);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      console.warn("[OfflineMag] Failed to load PDF from web cache, falling back to remote:", err);
    }
  }

  return metadata.pdfUrl; // Fallback to remote URL
}

/**
 * Get a local URL for the cover image.
 */
export function getLocalCoverUrl(metadata: OfflineMagazineMetadata): string {
  if (isNativePlatform && metadata.localCoverPath) {
    const rawPath = metadata.localCoverPath.startsWith("file://")
      ? metadata.localCoverPath
      : `file://${metadata.localCoverPath}`;
    return Capacitor.convertFileSrc(rawPath);
  }
  return metadata.coverImageUrl;
}

/**
 * Auto-recover downloads that were interrupted in the background on app start
 */
export function initOfflineDownloads(): void {
  if (typeof window === "undefined") return;

  const triggerRecovery = () => {
    const store = useUIStore.getState();
    const interrupted = Object.values(store.downloads).filter(
      (d) => d.status === "downloading" || d.status === "failed"
    );

    interrupted.forEach((d) => {
      console.log(`[OfflineMag] Auto-recovering download: ${d.title}`);
      if (d.pdfUrl) {
        downloadMagazineOffline(
          d.magazineId,
          d.pdfUrl,
          d.title,
          d.coverImageUrl || "",
          d.volume || "1",
          d.issueDate || "Unknown"
        ).catch((err) => {
          console.warn(`[OfflineMag] Auto-resume failed for ${d.title}:`, err);
        });
      } else {
        store.updateDownload(d.magazineId, { status: "paused" });
      }
    });
  };

  // 1. Initial recover on app start after network card stability
  setTimeout(triggerRecovery, 2500);

  // 2. Recover on network reconnection
  window.addEventListener("online", () => {
    console.log("[OfflineMag] Device came online. Auto-recovering downloads...");
    showToast("Reconnected. Resuming downloads...");
    triggerRecovery();
  });

  // 3. Recover on app foreground lifecycle event
  if (isNativePlatform) {
    try {
      CapApp.addListener("appStateChange", (state) => {
        if (state.isActive) {
          console.log("[OfflineMag] App foregrounded. Resuming active tasks...");
          triggerRecovery();
        }
      });
    } catch (err) {
      console.warn("[OfflineMag] Failed to register appStateChange listener:", err);
    }
  }
}
