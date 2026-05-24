/**
 * One-shot migration: upload every /uploads/<file> from public/uploads to
 * Cloudinary, then rewrite every URL referenced by Package and
 * CompanySettings documents to point at the new Cloudinary URLs.
 *
 * Idempotent — re-running skips URLs that no longer start with /uploads/.
 *
 * Run:
 *   node scripts/migrate-uploads-to-cloudinary.mjs
 *
 * Safety:
 * - Refuses production DB unless ALLOW_PRODUCTION_MIGRATION=1 (mirrors
 *   the seed.mjs convention).
 * - Reads only; if a referenced file is missing from public/uploads, the
 *   reference is left untouched and logged.
 * - Preserves all other fields. We only swap URL strings.
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { fileURLToPath } from "url";
import { dirname, join, basename } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

// ── Guards ─────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI not set in .env.local");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_MIGRATION !== "1") {
  console.error("❌  Refusing to run in production. Set ALLOW_PRODUCTION_MIGRATION=1 to override.");
  process.exit(1);
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌  Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local");
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// ── Models (loose schemas — we only read & rewrite specific paths) ────────
const PackageSchema = new mongoose.Schema({}, { strict: false, collection: "packages" });
const SettingsSchema = new mongoose.Schema({}, { strict: false, collection: "companysettings" });

const PackageModel = mongoose.models.Package ?? mongoose.model("Package", PackageSchema);
const SettingsModel = mongoose.models.CompanySettings ?? mongoose.model("CompanySettings", SettingsSchema);

const UPLOADS_DIR = join(__dirname, "..", "public", "uploads");
const CLOUDINARY_FOLDER = "camilo-catering";

// ── Cache: same /uploads URL → same Cloudinary URL across multiple docs ──
const urlCache = new Map();
let uploadedCount = 0;
let skippedCount = 0;
let missingCount = 0;

async function migrateOne(localUrl) {
  if (typeof localUrl !== "string" || !localUrl.startsWith("/uploads/")) {
    return localUrl; // not ours; leave alone
  }

  if (urlCache.has(localUrl)) {
    skippedCount++;
    return urlCache.get(localUrl);
  }

  const filename = basename(localUrl); // e.g. "1779034500954-95e472e4073d.jpg"
  const filePath = join(UPLOADS_DIR, filename);

  if (!existsSync(filePath)) {
    console.warn(`⚠️   File missing on disk, leaving URL untouched: ${localUrl}`);
    missingCount++;
    return localUrl;
  }

  // Strip extension; Cloudinary appends its own based on the source.
  const publicId = filename.replace(/\.[^.]+$/, "");

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: CLOUDINARY_FOLDER,
      public_id: publicId,
      resource_type: "image",
      overwrite: false,
    });
    uploadedCount++;
    urlCache.set(localUrl, result.secure_url);
    console.log(`✅  ${filename} → ${result.secure_url}`);
    return result.secure_url;
  } catch (err) {
    // If overwrite=false fires "already exists", reuse the existing URL.
    if (err?.error?.http_code === 409 || err?.http_code === 409) {
      const existingUrl = cloudinary.url(`${CLOUDINARY_FOLDER}/${publicId}`, {
        secure: true,
      });
      urlCache.set(localUrl, existingUrl);
      console.log(`↻  ${filename} already on Cloudinary, reusing URL`);
      return existingUrl;
    }
    console.error(`❌  Failed to upload ${filename}:`, err?.message ?? err);
    return localUrl; // keep the old reference rather than blank it
  }
}

/**
 * Walk an arbitrary value and rewrite any /uploads/* string in place.
 * Handles nested objects and arrays of any depth (Settings has nested
 * about/contact/home subdocs; Package only has flat fields, but this
 * covers both safely).
 */
async function rewriteValue(value) {
  if (typeof value === "string") {
    return await migrateOne(value);
  }
  if (Array.isArray(value)) {
    const out = [];
    for (const v of value) out.push(await rewriteValue(v));
    return out;
  }
  if (value && typeof value === "object" && !(value instanceof Date) && !mongoose.isValidObjectId(value)) {
    // Plain object — recurse into keys
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = await rewriteValue(v);
    }
    return out;
  }
  return value;
}

async function migrateCollection(Model, label) {
  const docs = await Model.find().lean();
  let updated = 0;
  for (const doc of docs) {
    const before = JSON.stringify(doc);
    // Strip _id before rewriting so the recursion doesn't think it's a string.
    const { _id, __v, createdAt, updatedAt, ...rest } = doc;
    const rewritten = await rewriteValue(rest);
    const after = JSON.stringify(rewritten);
    if (before === JSON.stringify({ _id, __v, createdAt, updatedAt, ...rewritten })) continue;

    await Model.updateOne({ _id }, { $set: rewritten });
    updated++;
  }
  console.log(`📝  ${label}: ${updated} document(s) updated`);
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("🔌  Connected to MongoDB\n");

  console.log("📦  Migrating packages...");
  await migrateCollection(PackageModel, "packages");

  console.log("\n⚙️   Migrating company settings...");
  await migrateCollection(SettingsModel, "companysettings");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🎉  Done. ${uploadedCount} uploaded, ${skippedCount} reused, ${missingCount} missing.`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
