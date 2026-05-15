"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MapPin, CheckCircle } from "lucide-react";
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
}

interface Props {
  packages: PackageOption[];
  defaultPackageId?: string;
}

export function BookingForm({ packages, defaultPackageId }: Props) {
  const router = useRouter();
  const { data: session } = useSession();

  const [selectedPkgId, setSelectedPkgId] = useState(
    defaultPackageId || packages[0]?._id || ""
  );
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedPkg = packages.find((p) => p._id === selectedPkgId);

  // Update guest count default when package changes
  useEffect(() => {
    if (selectedPkg) {
      setGuestCount(String(selectedPkg.minGuests));
    }
  }, [selectedPkgId, selectedPkg]);

  const guestNum = parseInt(guestCount) || 0;
  const guestError =
    selectedPkg && guestNum > 0
      ? guestNum < selectedPkg.minGuests
        ? `Minimum ${selectedPkg.minGuests} guests required`
        : guestNum > selectedPkg.maxGuests
        ? `Maximum ${selectedPkg.maxGuests} guests allowed`
        : ""
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!session?.user) {
      router.push(`/login?callbackUrl=/book`);
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

    setSuccess(true);
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center text-center gap-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            Booking Submitted!
          </h2>
          <p className="text-neutral-500 max-w-sm">
            Your booking request has been sent. The vendor will confirm shortly.
            Check your email for details.
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => router.push("/bookings")}
              className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              View My Bookings
            </button>
            <button
              onClick={() => router.push("/vendors")}
              className="inline-flex items-center justify-center h-10 px-5 text-sm font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:text-neutral-300"
            >
              Browse More
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Form */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
                  {error}
                </div>
              )}

              {!session?.user && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
                  You&apos;ll be asked to sign in before submitting.
                </div>
              )}

              {/* Package selector */}
              <div className="flex flex-col gap-2">
                <Label>Select Package</Label>
                <div className="flex flex-col gap-2">
                  {packages.map((pkg) => (
                    <button
                      key={pkg._id}
                      type="button"
                      onClick={() => setSelectedPkgId(pkg._id)}
                      className={`text-left rounded-lg border-2 p-4 transition-all ${
                        selectedPkgId === pkg._id
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                          : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-medium text-sm text-neutral-900 dark:text-white">
                            {pkg.name}
                          </span>
                          <Badge variant="neutral" className="ml-2 text-xs">
                            {pkg.category}
                          </Badge>
                        </div>
                        <span className="font-bold text-amber-600 flex-shrink-0">
                          {formatCurrency(pkg.price)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {pkg.minGuests}–{pkg.maxGuests} guests
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Event date */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="event-date">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Event Date
                  </span>
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>

              {/* Guest count */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="guests">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" /> Number of Guests
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

              {/* Venue */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="venue">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Venue / Location
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

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="notes">Special Requests (optional)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Dietary restrictions, theme preferences, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button type="submit" loading={loading} className="w-full" size="lg">
                {session?.user ? "Submit Booking Request" : "Sign In to Book"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Summary sidebar */}
      <div className="lg:col-span-2">
        {selectedPkg && (
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {selectedPkg.name}
                </p>
                <p className="text-sm text-neutral-500 mt-1">{selectedPkg.description}</p>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                  Inclusions
                </p>
                <ul className="flex flex-col gap-1.5">
                  {selectedPkg.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      {inc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex items-center justify-between">
                <span className="text-sm text-neutral-500">Total</span>
                <span className="text-xl font-bold text-amber-600">
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
