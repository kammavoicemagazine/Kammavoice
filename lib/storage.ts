// lib/storage.ts
import { storage } from "./firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

/**
 * Upload a file to Firebase Storage with a progress callback.
 * @param file The File (or Blob) to upload.
 * @param path Full storage path (e.g., "app-magazines/covers/uuid.jpg").
 * @param onProgress Optional callback receiving upload percent (0-100).
 * @returns Promise that resolves with the download URL of the uploaded file.
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) onProgress(percent);
      },
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}

// Additional helpers
export function uploadBytesResumableWrapper(file: File, path: string, onProgress?: (percent: number) => void) {
  const storageRef = ref(storage, path);
  const uploadTask = uploadBytesResumable(storageRef, file);
  if (onProgress) {
    uploadTask.on('state_changed', (snapshot) => {
      const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      onProgress(percent);
    });
  }
  return uploadTask;
}

export async function getDownloadUrl(refPath: string): Promise<string> {
  const storageRef = ref(storage, refPath);
  return getDownloadURL(storageRef);
}
export async function deleteFile(storagePath: string): Promise<void> {
  const fileRef = ref(storage, storagePath);
  await deleteObject(fileRef);
}
