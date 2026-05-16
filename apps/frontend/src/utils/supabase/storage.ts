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

export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<UploadResult> {
  const validationError = validateProfileImage(file);
  if (validationError) return { success: false, error: validationError };

  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${userId}/avatar.${ext}`;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(PROFILE_BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

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

export function getProfileImageUrl(userId: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(PROFILE_BUCKET)
    .getPublicUrl(`${userId}/avatar.jpg`);
  return data.publicUrl;
}
