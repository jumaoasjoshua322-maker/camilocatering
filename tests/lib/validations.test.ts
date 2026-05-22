import { describe, it, expect } from "vitest";
import {
  bookingSchema,
  contactMessageSchema,
  registerSchema,
  packageSchema,
} from "@/lib/validations";

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString();
};

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString();
};

const validObjectId = "507f1f77bcf86cd799439011";

describe("bookingSchema", () => {
  it("accepts a well-formed booking", () => {
    const r = bookingSchema.safeParse({
      packageId: validObjectId,
      eventDate: tomorrow(),
      guestCount: 50,
      venue: "Makati Shangri-La",
      notes: "Please prepare halal options.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects past event dates", () => {
    const r = bookingSchema.safeParse({
      packageId: validObjectId,
      eventDate: yesterday(),
      guestCount: 50,
      venue: "Makati Shangri-La",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid packageId shapes", () => {
    const r = bookingSchema.safeParse({
      packageId: "not-an-objectid",
      eventDate: tomorrow(),
      guestCount: 50,
      venue: "Makati Shangri-La",
    });
    expect(r.success).toBe(false);
  });

  it("rejects negative guestCount", () => {
    const r = bookingSchema.safeParse({
      packageId: validObjectId,
      eventDate: tomorrow(),
      guestCount: -5,
      venue: "Makati Shangri-La",
    });
    expect(r.success).toBe(false);
  });

  it("rejects too-short venue", () => {
    const r = bookingSchema.safeParse({
      packageId: validObjectId,
      eventDate: tomorrow(),
      guestCount: 50,
      venue: "x",
    });
    expect(r.success).toBe(false);
  });
});

describe("contactMessageSchema", () => {
  it("accepts a complete message", () => {
    const r = contactMessageSchema.safeParse({
      name: "Juan dela Cruz",
      email: "juan@example.com",
      phone: "+63 917 000 1234",
      message: "We would like to inquire about a corporate package for 80 guests.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects messages shorter than 10 chars", () => {
    const r = contactMessageSchema.safeParse({
      name: "Juan",
      email: "juan@example.com",
      message: "short",
    });
    expect(r.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const r = contactMessageSchema.safeParse({
      name: "Juan",
      email: "not-an-email",
      message: "Long enough message body for the validator to accept.",
    });
    expect(r.success).toBe(false);
  });

  it("treats phone as optional", () => {
    const r = contactMessageSchema.safeParse({
      name: "Juan",
      email: "juan@example.com",
      message: "Long enough message body for the validator to accept.",
    });
    expect(r.success).toBe(true);
  });
});

describe("registerSchema", () => {
  it("requires 12+ char password with mixed case and a digit", () => {
    const weak = registerSchema.safeParse({
      name: "Juan",
      email: "juan@example.com",
      password: "short1A",
    });
    expect(weak.success).toBe(false);

    const noUpper = registerSchema.safeParse({
      name: "Juan",
      email: "juan@example.com",
      password: "alllowercase1",
    });
    expect(noUpper.success).toBe(false);

    const noDigit = registerSchema.safeParse({
      name: "Juan",
      email: "juan@example.com",
      password: "NoDigitsHere",
    });
    expect(noDigit.success).toBe(false);

    const ok = registerSchema.safeParse({
      name: "Juan",
      email: "juan@example.com",
      password: "ProperLong1Pass",
    });
    expect(ok.success).toBe(true);
  });
});

describe("packageSchema", () => {
  it("rejects when maxGuests < minGuests", () => {
    const r = packageSchema.safeParse({
      name: "Test Package",
      description: "A test package description that is long enough to pass.",
      category: "WEDDING",
      price: 50000,
      minGuests: 100,
      maxGuests: 50,
      inclusions: ["Coordinator"],
    });
    expect(r.success).toBe(false);
  });

  it("accepts a valid package with /uploads-rooted imageUrl", () => {
    const r = packageSchema.safeParse({
      name: "Test Package",
      description: "A test package description that is long enough to pass.",
      category: "WEDDING",
      price: 50000,
      minGuests: 50,
      maxGuests: 100,
      inclusions: ["Coordinator", "Setup", "Waitstaff"],
      imageUrl: "/uploads/123-abc.jpg",
    });
    expect(r.success).toBe(true);
  });

  it("rejects javascript: URLs in imageUrl (defense in depth)", () => {
    const r = packageSchema.safeParse({
      name: "Test Package",
      description: "A test package description that is long enough to pass.",
      category: "WEDDING",
      price: 50000,
      minGuests: 50,
      maxGuests: 100,
      inclusions: ["Coordinator"],
      imageUrl: "javascript:alert(1)",
    });
    expect(r.success).toBe(false);
  });
});
