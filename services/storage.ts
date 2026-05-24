import { v2 as cloudinary } from "cloudinary";
import { randomBytes } from "node:crypto";

/**
 * Image storage abstraction backed by Cloudinary.
 *
 * Why Cloudinary:
 * - Vercel's runtime filesystem is read-only and ephemeral, so writing
 *   uploads to /public/uploads doesn't survive deploys.
 * - Cloudinary's free tier covers 25 GB storage + 25 GB monthly bandwidth,
 *   plenty for a single-tenant portfolio site.
 * - Their CDN serves WebP/AVIF automatically to modern browsers, so we
 *   get image optimization for free.
 *
 * Configuration is lazy: cloudinary.config() runs on first call so
 * importing this module during `next build` doesn't crash on missing env.
 *
 * The exported API (uploadImage, deleteAsset, detectImageMime,
 * ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES) matches the previous local-disk
 * implementation, so no caller code needs to change.
 */

export const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface UploadResult {
  url: string;
  bytes: number;
  contentType: string;
}

/**
 * Cloudinary "folder" for everything this app uploads. Keeps the
 * dashboard organized and makes deleteAsset's URL parser simple.
 */
const CLOUDINARY_FOLDER = "camilo-catering";

let configured = false;

function configure() {
  if (configured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

/**
 * Inspect the leading magic bytes to confirm the file matches what the
 * client claimed. Defends against trivial type spoofing where someone
 * uploads HTML/SVG/JS as `image/png`.
 *
 * Exported for tests; production callers go through `uploadImage`.
 */
export function detectImageMime(buf: Buffer): string | null {
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

  configure();

  const publicId = `${Date.now()}-${randomBytes(6).toString("hex")}`;
  // Cloudinary accepts a base64 data URI for inline buffer uploads —
  // simpler than streaming and works inside Vercel's serverless runtime.
  const dataUri = `data:${detected};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: CLOUDINARY_FOLDER,
    public_id: publicId,
    resource_type: "image",
    overwrite: false,
  });

  return {
    url: result.secure_url,
    bytes: file.size,
    contentType: detected,
  };
}

/**
 * Best-effort delete. Recognizes Cloudinary URLs we own (under the
 * configured folder) and ignores anything else (legacy /uploads paths,
 * external Unsplash URLs, etc.).
 *
 * Cloudinary URLs look like:
 *   https://res.cloudinary.com/<cloud>/image/upload/v1234567/<folder>/<id>.jpg
 * We need the public_id `<folder>/<id>` (no extension, no version) to
 * call destroy().
 */
export async function deleteAsset(url?: string | null): Promise<void> {
  if (!url) return;
  const match = url.match(
    new RegExp(`/upload/(?:v\\d+/)?(${CLOUDINARY_FOLDER}/[^.]+)`)
  );
  if (!match) return;

  configure();
  try {
    await cloudinary.uploader.destroy(match[1]);
  } catch {
    /* asset may already be gone; nothing to do */
  }
}
