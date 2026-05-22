import { describe, it, expect } from "vitest";
import { detectImageMime, ALLOWED_IMAGE_MIME, MAX_IMAGE_BYTES } from "@/services/storage";

/**
 * Magic-byte sniffing is the only thing standing between an admin upload
 * and "I disguised an HTML file as image/png" attacks. Spec: each ALLOWED
 * MIME has a unique signature, and bytes that don't match any signature
 * return null (which uploadImage turns into a 4xx).
 */

// Minimal real signatures padded to >= 12 bytes so the length guard passes.
const PAD = Buffer.alloc(16, 0);

function withSignature(sig: number[]): Buffer {
  const buf = Buffer.alloc(16, 0);
  for (let i = 0; i < sig.length; i++) buf[i] = sig[i];
  return buf;
}

describe("detectImageMime", () => {
  it("recognizes JPEG magic bytes (FF D8 FF)", () => {
    expect(detectImageMime(withSignature([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
  });

  it("recognizes PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)", () => {
    expect(
      detectImageMime(withSignature([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ).toBe("image/png");
  });

  it("recognizes GIF magic bytes (47 49 46 38)", () => {
    expect(detectImageMime(withSignature([0x47, 0x49, 0x46, 0x38]))).toBe("image/gif");
  });

  it("recognizes WebP signature (RIFF .... WEBP)", () => {
    const buf = Buffer.alloc(16, 0);
    // "RIFF" at 0..3
    buf[0] = 0x52; buf[1] = 0x49; buf[2] = 0x46; buf[3] = 0x46;
    // 4..7 are file size (any value)
    // "WEBP" at 8..11
    buf[8] = 0x57; buf[9] = 0x45; buf[10] = 0x42; buf[11] = 0x50;
    expect(detectImageMime(buf)).toBe("image/webp");
  });

  it("returns null for buffers shorter than 12 bytes", () => {
    expect(detectImageMime(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull();
  });

  it("returns null for HTML disguised as an image", () => {
    // "<!DOCTYPE html>"
    const html = Buffer.from("<!DOCTYPE html>" + " ".repeat(8));
    expect(detectImageMime(html)).toBeNull();
  });

  it("returns null for SVG (text-based, would XSS if served)", () => {
    const svg = Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>");
    expect(detectImageMime(svg)).toBeNull();
  });

  it("returns null for arbitrary binary that does not match any signature", () => {
    const random = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b]);
    expect(detectImageMime(random)).toBeNull();
  });

  it("only ever returns a MIME that is in ALLOWED_IMAGE_MIME", () => {
    // Exhaustive check across the four supported types — every detection
    // path resolves to a MIME we accept.
    const cases: Buffer[] = [
      withSignature([0xff, 0xd8, 0xff]),
      withSignature([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      withSignature([0x47, 0x49, 0x46, 0x38]),
      (() => {
        const buf = Buffer.alloc(16, 0);
        buf[0] = 0x52; buf[1] = 0x49; buf[2] = 0x46; buf[3] = 0x46;
        buf[8] = 0x57; buf[9] = 0x45; buf[10] = 0x42; buf[11] = 0x50;
        return buf;
      })(),
    ];
    for (const buf of cases) {
      const detected = detectImageMime(buf);
      expect(detected).not.toBeNull();
      expect(ALLOWED_IMAGE_MIME.has(detected!)).toBe(true);
    }
    // Suppress "PAD unused" when refactoring later.
    void PAD;
  });
});

describe("upload constants", () => {
  it("caps uploads at 5 MB", () => {
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
  });
});
