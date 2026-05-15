"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PackageFormModal } from "./package-form-modal";
import { formatCurrency } from "@/lib/utils";
import type { PackageCategory } from "@/types";

export interface PackageData {
  _id: string;
  name: string;
  description: string;
  category: PackageCategory;
  price: number;
  minGuests: number;
  maxGuests: number;
  inclusions: string[];
  isActive: boolean;
}

const categoryColors: Record<PackageCategory, "default" | "success" | "warning" | "neutral" | "danger"> = {
  WEDDING: "default",
  CORPORATE: "neutral",
  BIRTHDAY: "warning",
  SOCIAL: "success",
  OTHER: "neutral",
};

export function PackageManager() {
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PackageData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/packages");
    const json = await res.json();
    if (json.success) setPackages(json.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  async function handleToggle(pkg: PackageData) {
    const res = await fetch(`/api/packages/${pkg._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    if (res.ok) {
      setPackages((prev) =>
        prev.map((p) => p._id === pkg._id ? { ...p, isActive: !p.isActive } : p)
      );
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError("");
    const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      setPackages((prev) => prev.filter((p) => p._id !== id));
    } else {
      setError(json.error || "Failed to delete package");
    }
    setDeletingId(null);
  }

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(pkg: PackageData) {
    setEditing(pkg);
    setModalOpen(true);
  }

  function handleSaved(pkg: PackageData) {
    setPackages((prev) => {
      const exists = prev.find((p) => p._id === pkg._id);
      return exists
        ? prev.map((p) => (p._id === pkg._id ? pkg : p))
        : [pkg, ...prev];
    });
    setModalOpen(false);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {packages.length} package{packages.length !== 1 ? "s" : ""}
        </p>
        <Button onClick={openCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Package
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700">
          <Package className="h-12 w-12 text-neutral-300 mb-4" />
          <p className="text-neutral-500 mb-4">No packages yet</p>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Create your first package
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg._id}
              pkg={pkg}
              onEdit={() => openEdit(pkg)}
              onToggle={() => handleToggle(pkg)}
              onDelete={() => handleDelete(pkg._id)}
              deleting={deletingId === pkg._id}
            />
          ))}
        </div>
      )}

      <PackageFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editing={editing}
      />
    </>
  );
}

function PackageCard({
  pkg,
  onEdit,
  onToggle,
  onDelete,
  deleting,
}: {
  pkg: PackageData;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card className={!pkg.isActive ? "opacity-60" : ""}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                {pkg.name}
              </h3>
              <Badge variant={categoryColors[pkg.category]}>{pkg.category}</Badge>
              {!pkg.isActive && <Badge variant="neutral">Inactive</Badge>}
            </div>
            <p className="text-sm text-neutral-500 line-clamp-2">{pkg.description}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-lg font-bold text-amber-600">{formatCurrency(pkg.price)}</div>
            <div className="text-xs text-neutral-400">{pkg.minGuests}–{pkg.maxGuests} guests</div>
          </div>
        </div>

        {/* Inclusions preview */}
        {pkg.inclusions.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {pkg.inclusions.slice(0, 3).map((inc, i) => (
              <span key={i} className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full px-2 py-0.5">
                {inc}
              </span>
            ))}
            {pkg.inclusions.length > 3 && (
              <span className="text-xs text-neutral-400">+{pkg.inclusions.length - 3} more</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <button
            onClick={onToggle}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            {pkg.isActive
              ? <ToggleRight className="h-4 w-4 text-green-500" />
              : <ToggleLeft className="h-4 w-4" />}
            {pkg.isActive ? "Active" : "Inactive"}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-amber-600 transition-colors px-2 py-1 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onDelete(); setConfirmDelete(false); }}
                  disabled={deleting}
                  className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {deleting ? "Deleting..." : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-neutral-500 px-2 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-600 transition-colors px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
