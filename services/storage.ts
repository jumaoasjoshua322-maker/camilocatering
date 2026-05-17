import { mkdir, writeFile, unlink, stat } from "node:fs/promises";
import { join } from "node:path";
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

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

/**
 * Inspect the leading magic bytes to confirm the file matches what the
 * client claimed. Defends against trivial type spoofing where someone
 * uploads HTML/SVG/JS as `image/png`.
 */
function detectImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "image/png";
  // GIF: 47 49 46 38 (GIF8)
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  // WebP: "RIFF" .... "WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ALLOWED_IMAGE_MIME.has(file.type)) {
    throw new Error("Unsupported image type");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is larger than 5 MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageMime(buffer);
  if (!detected || !ALLOWED_IMAGE_MIME.has(detected) || detected !== file.type) {
    throw new Error("File contents do not match declared image type");
  }

  await ensureDir(PUBLIC_UPLOADS_DIR);

  const ext = EXT_BY_MIME[detected];
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  await writeFile(join(PUBLIC_UPLOADS_DIR, name), buffer);

  return {
    url: `${PUBLIC_URL_PREFIX}/${name}`,
    bytes: file.size,
    contentType: detected,
  };
}

/**
 * Best-effort delete. Only deletes assets we own (under /uploads).
 * Silently ignores missing files and external URLs.
 */
export async function deleteAsset(url?: string | null): Promise<void> {
  if (!url || !url.startsWith(PUBLIC_URL_PREFIX + "/")) return;
  const filename = url.slice(PUBLIC_URL_PREFIX.length + 1);
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) return;
  try {
    await unlink(join(PUBLIC_UPLOADS_DIR, filename));
  } catch {
    /* ignore */
  }
}
