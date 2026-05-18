"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar as CalendarIcon,
  MapPin,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChefHat,
} from "lucide-react";
import type { PackageCategory } from "@/types";

interface PackageOption {
  _id: string;
  name: string;
  description: string;
  category: PackageCategory;
  price: number;
  minGuests: number;
  maxGuests: number;
  inclusions: string[];
  imageUrl?: string;
  isFeatured?: boolean;
}

interface Props {
  packages: PackageOption[];
  defaultPackageId?: string;
}

const STEPS = ["Choose package", "Event details", "Review"] as const;
const DRAFT_KEY = "camilo-booking-draft";

interface Draft {
  packageId: string;
  eventDate: string;
  guestCount: string;
  venue: string;
  notes: string;
}

function formatPrettyDate(d: string) {
  if (!d) return "";
  const dt = new Date(d);
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

export function BookingForm({ packages, defaultPackageId }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [selectedPkgId, setSelectedPkgId] = useState(defaultPackageId || packages[0]?._id || "");
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedPkg = packages.find((p) => p._id === selectedPkgId);

  // Rehydrate draft once on mount
  const rehydrated = useRef(false);
  useEffect(() => {
    if (rehydrated.current) return;
    rehydrated.current = true;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<Draft>;
        if (draft.packageId && packages.some((p) => p._id === draft.packageId)) {
          setSelectedPkgId(draft.packageId);
        }
        if (draft.eventDate) setEventDate(draft.eventDate);
        if (draft.guestCount) setGuestCount(draft.guestCount);
        if (draft.venue) setVenue(draft.venue);
        if (draft.notes) setNotes(draft.notes);
        // Skip ahead if we have details already (came back from login)
        if (draft.eventDate && draft.guestCount && draft.venue) setStep(2);
        else if (draft.packageId) setStep(1);
        sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      /* ignore corrupt drafts */
    }
  }, [packages]);

  // Default guest count to package minimum
  useEffect(() => {
    if (selectedPkg && !guestCount) {
      setGuestCount(String(selectedPkg.minGuests));
    }
  }, [selectedPkgId, selectedPkg, guestCount]);

  const guestNum = parseInt(guestCount) || 0;
  const guestError = useMemo(() => {
    if (!selectedPkg || guestNum <= 0) return "";
    if (guestNum < selectedPkg.minGuests) return `Minimum ${selectedPkg.minGuests} guests required`;
    if (guestNum > selectedPkg.maxGuests) return `Maximum ${selectedPkg.maxGuests} guests allowed`;
    return "";
  }, [selectedPkg, guestNum]);

  const minDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const canAdvanceFromStep0 = !!selectedPkgId;
  const canAdvanceFromStep1 = !!eventDate && !!venue.trim() && !guestError && guestNum > 0;

  function persistDraft() {
    try {
      const draft: Draft = {
        packageId: selectedPkgId,
        eventDate,
        guestCount,
        venue,
        notes,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit() {
    if (status === "loading") return;
    if (!session?.user) {
      persistDraft();
      router.push("/login?callbackUrl=/book");
      return;
    }
    if (!selectedPkgId || !eventDate || !venue || !guestCount) {
      setError("Please fill in all required fields");
      return;
    }
    if (guestError) {
      setError(guestError);
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: selectedPkgId,
        eventDate,
        guestCount: parseInt(guestCount),
        venue,
        notes,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Failed to create booking");
      return;
    }

    sessionStorage.removeItem(DRAFT_KEY);
    setSuccess(true);
  }

  // Success state
  if (success) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="font-display text-2xl text-neutral-900 dark:text-white">
            Booking submitted
          </h2>
          <p className="text-neutral-500 max-w-sm">
            We've received your request. Staff will confirm within 24 hours and you'll
            get an email with next steps.
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => router.push("/bookings")}
              className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors"
            >
              View my bookings
            </button>
            <button
              onClick={() => router.push("/services")}
              className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300"
            >
              Browse packages
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Form column */}
      <div className="lg:col-span-3 flex flex-col gap-5">
        <Stepper step={step} />

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 0 && (
          <Card>
            <CardContent className="p-5 sm:p-6 flex flex-col gap-3">
              <div>
                <Label className="text-base">Choose a package</Label>
                <p className="text-xs text-neutral-500 mt-0.5">
                  You can change this on the next step.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {packages.map((pkg) => {
                  const active = selectedPkgId === pkg._id;
                  return (
                    <button
                      key={pkg._id}
                      type="button"
                      onClick={() => setSelectedPkgId(pkg._id)}
                      className={`text-left rounded-xl border-2 p-3 sm:p-4 transition-all flex gap-3 sm:gap-4 ${
                        active
                          ? "border-amber-700 bg-amber-50/60 dark:bg-amber-900/15"
                          : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
                      }`}
                    >
                      <div className="relative h-16 w-20 sm:h-20 sm:w-28 shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        {pkg.imageUrl ? (
                          <Image
                            src={pkg.imageUrl}
                            alt=""
                            fill
                            sizes="112px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ChefHat className="h-6 w-6 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display text-base text-neutral-900 dark:text-white truncate">
                              {pkg.name}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2 flex-wrap">
                              <Badge variant="neutral" className="text-[10px]">
                                {pkg.category}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {pkg.minGuests}–{pkg.maxGuests} guests
                              </span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-neutral-500 leading-none">from</p>
                            <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm tabular-nums whitespace-nowrap">
                              {formatCurrency(pkg.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardContent className="p-5 sm:p-6 flex flex-col gap-5">
              <div>
                <Label className="text-base">Event details</Label>
                <p className="text-xs text-neutral-500 mt-0.5">
                  We use these to plan logistics and confirm your booking.
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-date">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" /> Event date
                  </span>
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  min={minDate}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="guests">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Number of guests
                  </span>
                </Label>
                <Input
                  id="guests"
                  type="number"
                  min={selectedPkg?.minGuests || 1}
                  max={selectedPkg?.maxGuests}
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  error={guestError}
                  required
                />
                {selectedPkg && (
                  <p className="text-xs text-neutral-400">
                    {selectedPkg.minGuests}–{selectedPkg.maxGuests} guests for this package
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="venue">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Venue or location
                  </span>
                </Label>
                <Input
                  id="venue"
                  placeholder="e.g. The Grand Ballroom, Makati City"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Special requests (optional)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Dietary restrictions, theme preferences, anything else."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && selectedPkg && (
          <Card>
            <CardContent className="p-5 sm:p-6 flex flex-col gap-5">
              <div>
                <Label className="text-base">Review your request</Label>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Confirm the details below. Staff will review and confirm within 24 hours.
                </p>
              </div>
              <ReviewRow label="Package" value={selectedPkg.name} />
              <ReviewRow label="Event date" value={formatPrettyDate(eventDate)} />
              <ReviewRow label="Guests" value={`${guestCount} guests`} />
              <ReviewRow label="Venue" value={venue} />
              {notes && <ReviewRow label="Special requests" value={notes} multiline />}
              {!session?.user && status !== "loading" && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
                  You'll sign in before we save the booking. Your details will be kept while you log in.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wizard nav */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2) : s))}
            disabled={step === 0}
            className="inline-flex h-10 items-center gap-1.5 px-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < 2 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 0 | 1 | 2)}
              disabled={(step === 0 && !canAdvanceFromStep0) || (step === 1 && !canAdvanceFromStep1)}
              className="gap-1.5"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              loading={loading}
            >
              {session?.user ? "Submit booking" : "Sign in & submit"}
            </Button>
          )}
        </div>
      </div>

      {/* Summary sidebar */}
      <div className="lg:col-span-2">
        {selectedPkg && (
          <Card className="lg:sticky lg:top-24">
            <CardContent className="p-5 sm:p-6 flex flex-col gap-4">
              {selectedPkg.imageUrl && (
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                  <Image
                    src={selectedPkg.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                  {selectedPkg.category}
                </p>
                <h2 className="font-display text-lg text-neutral-900 dark:text-white">
                  {selectedPkg.name}
                </h2>
                <p className="text-sm text-neutral-500 mt-1 line-clamp-3">
                  {selectedPkg.description}
                </p>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                  Inclusions
                </p>
                <ul className="flex flex-col gap-1.5 max-h-44 overflow-auto pr-1">
                  {selectedPkg.inclusions.map((inc, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-700 mt-1.5 shrink-0" />
                      {inc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex items-center justify-between">
                <span className="text-sm text-neutral-500">Total</span>
                <span className="text-xl font-semibold text-amber-800 dark:text-amber-400 tabular-nums">
                  {formatCurrency(selectedPkg.price)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Stepper({ step }: { step: 0 | 1 | 2 }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3 flex-1">
            <span
              className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-amber-700 text-white"
                  : active
                  ? "bg-amber-50 text-amber-800 ring-2 ring-amber-700 dark:bg-amber-900/30 dark:text-amber-200"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
              }`}
            >
              {done ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={`truncate font-medium ${
                active
                  ? "text-neutral-900 dark:text-white"
                  : done
                  ? "text-neutral-700 dark:text-neutral-300"
                  : "text-neutral-400"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="hidden sm:block flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ReviewRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div
      className={`grid ${multiline ? "grid-cols-1 gap-1" : "grid-cols-3 gap-3 items-baseline"} pb-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 last:pb-0`}
    >
      <span className="text-xs uppercase tracking-wide text-neutral-500">{label}</span>
      <span
        className={`text-sm text-neutral-900 dark:text-white ${multiline ? "" : "col-span-2"}`}
      >
        {value}
      </span>
    </div>
  );
}
