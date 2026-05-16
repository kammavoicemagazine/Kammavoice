/**
 * Cloudinary upload architecture.
 * Supports image, video, and raw (PDF) file types with progress tracking.
 */

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "placeholder_cloud",
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "placeholder_preset",
};

/** Build a Cloudinary optimized image URL with transformations */
export function cloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: "auto" | number;
    format?: "auto" | "webp" | "avif" | "jpg";
    crop?: "fill" | "fit" | "scale" | "thumb";
  } = {}
): string {
  const { width, height, quality = "auto", format = "auto", crop = "fill" } = options;

  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push(`q_${quality}`, `f_${format}`, `c_${crop}`);

  const transformStr = transforms.join(",");
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformStr}/${publicId}`;
}

/** 
 * Upload a file to Cloudinary. 
 * Supports tracking upload progress via XMLHttpRequest.
 */
export async function uploadToCloudinary(
  file: File,
  options?: {
    resourceType?: "image" | "video" | "raw" | "auto";
    folder?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<{
  url: string;
  publicId: string;
  width?: number;
  height?: number;
}> {
  return new Promise((resolve, reject) => {
    const resourceType = options?.resourceType || "auto";
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);
    if (options?.folder) {
      formData.append("folder", options.folder);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    if (options?.onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          options.onProgress!(progress);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          url: response.secure_url,
          publicId: response.public_id,
          width: response.width,
          height: response.height,
        });
      } else {
        console.error("Cloudinary Upload Raw Response:", xhr.responseText);
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.error?.message || `Upload failed: ${xhr.statusText}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}
