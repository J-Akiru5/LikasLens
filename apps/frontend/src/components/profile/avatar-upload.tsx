"use client";

import { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { uploadProfileImage, validateProfileImage } from "@/utils/supabase/storage";

interface AvatarUploadProps {
  userId: string;
  currentUrl?: string | null;
  onUploadComplete: (url: string) => void;
}

export function AvatarUpload({ userId, currentUrl, onUploadComplete }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validationError = validateProfileImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    const result = await uploadProfileImage(userId, file);
    setUploading(false);

    if (result.success) {
      onUploadComplete(result.url);
      setPreview(null);
    } else {
      setError(result.error);
      URL.revokeObjectURL(objectUrl);
      setPreview(null);
    }
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-24 h-24 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center bg-primary/10 flex-shrink-0">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Profile preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className="w-8 h-8 text-primary/60" />
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Spinner size={20} className="text-primary" />
          </div>
        )}
      </div>

      <div className="flex-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 border-2 border-primary font-bold uppercase text-sm rounded hover:bg-primary/5 transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {currentUrl ? "Change Photo" : "Upload Photo"}
        </button>
        <p className="text-xs font-mono surface-muted mt-2">JPEG, PNG, or WebP. Max 25MB.</p>
        {error && (
          <p className="text-xs font-mono text-accent mt-1">{error}</p>
        )}
      </div>

      {preview && (
        <button
          type="button"
          onClick={() => {
            setPreview(null);
            setError(null);
          }}
          className="p-2 border-2 border-accent text-accent rounded hover:bg-accent/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
