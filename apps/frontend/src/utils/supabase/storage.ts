"use client";

import { createClient } from "./client";

const PROFILE_BUCKET = "profile-images";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type UploadResult =
  | { success: true; url: string; path: string }
  | { success: false; error: string };

export function validateProfileImage(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "Image must be under 2MB.";
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }
  return null;
}

function stripExifFromFile(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else resolve(file);
        }, file.type, 0.92);
      } catch { URL.revokeObjectURL(url); resolve(file); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<UploadResult> {
  const validationError = validateProfileImage(file);
  if (validationError) return { success: false, error: validationError };

  const cleanedBlob = await stripExifFromFile(file);
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${userId}/avatar.${ext}`;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(filePath, cleanedBlob, { upsert: true, contentType: file.type });

  if (error) {
    if (error.message.includes("bucket")) {
      return {
        success: false,
        error:
          "Profile storage is not set up. Ask an admin to create the 'profile-images' bucket in Supabase.",
      };
    }
    return { success: false, error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(data.path);

  return { success: true, url: publicUrl, path: data.path };
}

export async function getProfileImageUrl(userId: string): Promise<string | null> {
  const supabase = createClient();
  const { data: files } = await supabase.storage
    .from(PROFILE_BUCKET)
    .list(userId, { limit: 1, sortBy: { column: "created_at", order: "desc" } });

  if (!files || files.length === 0) return null;
  const { data } = supabase.storage
    .from(PROFILE_BUCKET)
    .getPublicUrl(`${userId}/${files[0].name}`);
  return data.publicUrl;
}

export async function deleteProfileImage(userId: string): Promise<void> {
  const supabase = createClient();
  const { data: files } = await supabase.storage
    .from(PROFILE_BUCKET)
    .list(userId);

  if (files && files.length > 0) {
    const paths = files.map((f: { name: string }) => `${userId}/${f.name}`);
    await supabase.storage.from(PROFILE_BUCKET).remove(paths);
  }
}


