"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2, AlertCircle, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  /** Optional second line under the hint, e.g. "Recommended 1920x1080, landscape". */
  recommended?: string;
  aspect?: "video" | "square" | "wide";
  className?: string;
}

const ASPECTS: Record<NonNullable<Props["aspect"]>, string> = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[3/1]",
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function ImageUploadField({
  value,
  onChange,
  label,
  hint = "JPG, PNG, WebP or GIF up to 5 MB",
  recommended,
  aspect = "video",
  className,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined | null) {
    if (!file) return;
    setError("");

    // Quick client-side guards before we round-trip the server.
    if (!file.type.startsWith("image/")) {
      setError("That doesn't look like an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is larger than 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || `Upload failed (${res.status})`);
        return;
      }
      onChange(data.data.url);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </span>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative w-full rounded-lg border-2 border-dashed overflow-hidden bg-neutral-50 dark:bg-neutral-900/50 transition-colors",
          dragOver
            ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
            : "border-neutral-200 dark:border-neutral-700",
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
            {/* Replace overlay — appears on hover, full clickable area */}
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 focus-visible:bg-black/40 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
              aria-label="Replace image"
            >
              <span className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-neutral-900 shadow">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Replace
                  </>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              disabled={uploading}
              className="absolute top-2 right-2 h-8 w-8 rounded-md bg-black/60 text-white hover:bg-black/80 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-amber-600 transition-colors disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
          >
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                <span className="text-sm font-medium text-amber-600">Uploading...</span>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-2xl bg-white dark:bg-neutral-800 flex items-center justify-center shadow-sm">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">
                  {dragOver ? "Drop to upload" : "Click or drop an image"}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <p className="text-xs text-neutral-400">{hint}</p>
      {recommended && (
        <p className="text-xs text-neutral-500">{recommended}</p>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
