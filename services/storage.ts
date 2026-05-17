import { mkdir, writeFile, unlink, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Storage abstraction. Today: writes to /public/uploads.
 * Swap this single file to move to Vercel Blob / Cloudinary / S3
 * without touching any callers.
 */

export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const PUBLIC_UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const PUBLIC_URL_PREFIX = "/uploads";

export interface UploadResult {
  url: string;
  bytes: number;
  contentType: string;
}

async function ensureDir(dir: string) {
  try {
    await stat(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    throw new Error("Unsupported image type");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is larger than 5 MB");
  }

  await ensureDir(PUBLIC_UPLOADS_DIR);

  const ext = EXT_BY_MIME[file.type] ?? extname(file.name) ?? "";
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(join(PUBLIC_UPLOADS_DIR, name), buffer);

  return {
    url: `${PUBLIC_URL_PREFIX}/${name}`,
    bytes: file.size,
    contentType: file.type,
  };
}

/**
 * Best-effort delete. Only deletes assets we own (under /uploads).
 * Silently ignores missing files and external URLs.
 */
export async function deleteAsset(url?: string | null): Promise<void> {
  if (!url || !url.startsWith(PUBLIC_URL_PREFIX + "/")) return;
  const filename = url.slice(PUBLIC_URL_PREFIX.length + 1);
  // prevent path traversal
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return;
  try {
    await unlink(join(PUBLIC_UPLOADS_DIR, filename));
  } catch {
    /* ignore */
  }
}
