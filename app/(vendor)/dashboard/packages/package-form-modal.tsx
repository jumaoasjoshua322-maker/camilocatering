"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "@/lib/use-form";
import { packageSchema } from "@/lib/validations";
import type { PackageData } from "./package-manager";
import type { PackageCategory } from "@/types";

// ── Wedding packages MUST include these items (business rule) ──────────────
const WEDDING_REQUIRED_INCLUSIONS = [
  "Event coordinator",
  "Setup & breakdown crew",
  "Waitstaff",
];

const CATEGORIES: PackageCategory[] = [
  "WEDDING",
  "CORPORATE",
  "BIRTHDAY",
  "SOCIAL",
  "OTHER",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (pkg: PackageData) => void;
  editing: PackageData | null;
}

export function PackageFormModal({ open, onClose, editing, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inclusions, setInclusions] = useState<string[]>([""]);
  const [inclusionError, setInclusionError] = useState("");

  const { values, errors, handleChange, setValue, reset, setValues } =
    useForm({
      name: "",
      description: "",
      category: "WEDDING" as PackageCategory,
      price: 0,
      minGuests: 1,
      maxGuests: 100,
    });
  // Populate form when editing
  useEffect(() => {
    if (editing) {
      setValues({
        name: editing.name,
        description: editing.description,
        category: editing.category,
        price: editing.price,
        minGuests: editing.minGuests,
        maxGuests: editing.maxGuests,
      });
      setInclusions(editing.inclusions.length > 0 ? editing.inclusions : [""]);
    } else {
      reset();
      setInclusions([""]);
    }
    setError("");
    setInclusionError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open]);

  // Auto-inject required wedding inclusions when category switches to WEDDING
  useEffect(() => {
    if (values.category === "WEDDING") {
      setInclusions((prev) => {
        const existing = prev.filter((i) => i.trim() !== "");
        const missing = WEDDING_REQUIRED_INCLUSIONS.filter(
          (req) => !existing.some((e) => e.toLowerCase() === req.toLowerCase())
        );
        return [...existing, ...missing, ""];
      });
    }
  }, [values.category]);

  function addInclusion() {
    setInclusions((prev) => [...prev, ""]);
  }

  function updateInclusion(index: number, value: string) {
    setInclusions((prev) => prev.map((inc, i) => (i === index ? value : inc)));
  }

  function removeInclusion(index: number) {
    const item = inclusions[index];
    // Prevent removing required wedding inclusions
    if (
      values.category === "WEDDING" &&
      WEDDING_REQUIRED_INCLUSIONS.some(
        (req) => req.toLowerCase() === item.toLowerCase()
      )
    ) {
      setInclusionError(`"${item}" is required for wedding packages`);
      return;
    }
    setInclusions((prev) => prev.filter((_, i) => i !== index));
    setInclusionError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInclusionError("");

    const cleanInclusions = inclusions.filter((i) => i.trim() !== "");

    // Enforce wedding required inclusions
    if (values.category === "WEDDING") {
      const missing = WEDDING_REQUIRED_INCLUSIONS.filter(
        (req) =>
          !cleanInclusions.some((i) => i.toLowerCase() === req.toLowerCase())
      );
      if (missing.length > 0) {
        setInclusionError(
          `Wedding packages must include: ${missing.join(", ")}`
        );
        return;
      }
    }

    if (cleanInclusions.length === 0) {
      setInclusionError("At least one inclusion is required");
      return;
    }

    const payload = {
      ...values,
      price: Number(values.price),
      minGuests: Number(values.minGuests),
      maxGuests: Number(values.maxGuests),
      inclusions: cleanInclusions,
    };

    // Validate the full payload, not just the form-state fields,
    // so inclusions is part of the schema check.
    const parsed = packageSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    setError("");

    const url = editing ? `/api/packages/${editing._id}` : "/api/packages";
    const method = editing ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Failed to save package");
      return;
    }

    onSaved(json.data);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit Package" : "Create Package"}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pkg-name">Package Name</Label>
              <Input
                id="pkg-name"
                placeholder="e.g. Classic Wedding Package"
                value={values.name}
                onChange={handleChange("name")}
                error={errors.name}
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select
                value={values.category}
                onValueChange={(v) => setValue("category", v as PackageCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {values.category === "WEDDING" && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠ Wedding packages require: {WEDDING_REQUIRED_INCLUSIONS.join(", ")}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pkg-desc">Description</Label>
              <Textarea
                id="pkg-desc"
                rows={3}
                placeholder="Describe what makes this package special..."
                value={values.description}
                onChange={handleChange("description")}
                error={errors.description}
              />
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pkg-price">Price (PHP)</Label>
              <Input
                id="pkg-price"
                type="number"
                min={0}
                step={500}
                placeholder="85000"
                value={values.price || ""}
                onChange={handleChange("price")}
                error={errors.price}
              />
            </div>

            {/* Guest range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pkg-min">Min Guests</Label>
                <Input
                  id="pkg-min"
                  type="number"
                  min={1}
                  value={values.minGuests || ""}
                  onChange={handleChange("minGuests")}
                  error={errors.minGuests}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pkg-max">Max Guests</Label>
                <Input
                  id="pkg-max"
                  type="number"
                  min={1}
                  value={values.maxGuests || ""}
                  onChange={handleChange("maxGuests")}
                  error={errors.maxGuests}
                />
              </div>
            </div>

            {/* Inclusions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Inclusions</Label>
                <button
                  type="button"
                  onClick={addInclusion}
                  className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  <Plus className="h-3.5 w-3.5" /> Add item
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {inclusions.map((inc, i) => {
                  const isRequired =
                    values.category === "WEDDING" &&
                    WEDDING_REQUIRED_INCLUSIONS.some(
                      (r) => r.toLowerCase() === inc.toLowerCase()
                    );
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder={`Inclusion ${i + 1}`}
                        value={inc}
                        onChange={(e) => updateInclusion(i, e.target.value)}
                        className={isRequired ? "border-amber-300 dark:border-amber-700" : ""}
                      />
                      {isRequired ? (
                        <span className="text-xs text-amber-500 flex-shrink-0 w-16 text-center">
                          required
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => removeInclusion(i)}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {inclusionError && (
                <p className="text-xs text-red-500">{inclusionError}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 px-4 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <Button type="submit" loading={loading}>
                {editing ? "Save Changes" : "Create Package"}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
