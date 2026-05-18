import Link from "next/link";
import Image from "next/image";
import { Users, ChefHat } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PackageCategory } from "@/types";

export interface PackageCardData {
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

const CATEGORY_LABEL: Record<PackageCategory, string> = {
  WEDDING: "Wedding",
  CORPORATE: "Corporate",
  BIRTHDAY: "Birthday",
  SOCIAL: "Social",
  OTHER: "Other",
};

interface Props {
  pkg: PackageCardData;
  className?: string;
}

export function PackageCard({ pkg, className }: Props) {
  const bookHref = `/book?packageId=${pkg._id}`;

  return (
    <article
      className={`group flex flex-col rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all ${className ?? ""}`}
    >
      {/* Photo */}
      <Link
        href={bookHref}
        className="relative block aspect-[4/3] bg-neutral-100 dark:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
      >
        {pkg.imageUrl ? (
          <Image
            src={pkg.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ChefHat className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
          </div>
        )}
        {pkg.isFeatured && (
          <span className="absolute top-3 left-3 rounded-md bg-white/95 backdrop-blur px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-sm">
            Most popular
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
              {CATEGORY_LABEL[pkg.category]} · {pkg.minGuests}–{pkg.maxGuests} guests
            </p>
            <h3 className="font-display text-lg leading-snug text-neutral-900 dark:text-white truncate">
              {pkg.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-neutral-500">from</p>
            <p className="font-semibold text-amber-800 dark:text-amber-400 tabular-nums whitespace-nowrap">
              {formatCurrency(pkg.price)}
            </p>
          </div>
        </div>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
          {pkg.description}
        </p>

        {pkg.inclusions.length > 0 && (
          <ul className="flex flex-col gap-1.5 mt-1">
            {pkg.inclusions.slice(0, 4).map((inc, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400"
              >
                <span className="h-1 w-1 rounded-full bg-amber-700 shrink-0" />
                <span className="truncate">{inc}</span>
              </li>
            ))}
            {pkg.inclusions.length > 4 && (
              <li className="text-xs text-neutral-400 ml-3">
                + {pkg.inclusions.length - 4} more
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto pt-4 flex items-center gap-3">
          <Link
            href={bookHref}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white hover:bg-amber-800 transition-colors flex-1"
          >
            Book this package
          </Link>
        </div>
      </div>
    </article>
  );
}
