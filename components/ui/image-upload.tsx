"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  aspect?: "video" | "square" | "wide";
  className?: string;
}

const ASPECTS: Record<NonNullable<Props["aspect"]>, string> = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[3/1]",
};

export function ImageUploadField({
  value,
  onChange,
  label,
  hint = "JPG, PNG, WebP up to 5 MB",
  aspect = "video",
  className,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      onChange(data.data.url);
    } catch {
      setError("Network error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>}

      <div
        className={cn(
          "relative w-full rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700 overflow-hidden bg-neutral-50 dark:bg-neutral-900/50",
          ASPECTS[aspect]
        )}
      >
        {value ? (
          <>
            <Image
              src={value}
              alt={label || "Uploaded image"}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-2 right-2 h-8 w-8 rounded-md bg-black/60 text-white hover:bg-black/80 flex items-center justify-center"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400 hover:text-amber-600 transition-colors"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-xs">{uploading ? "Uploading..." : "Click to upload"}</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-neutral-400">{hint}</p>
        {value && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-amber-600 hover:text-amber-700"
          >
            Replace
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
