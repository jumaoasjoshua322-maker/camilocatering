import Link from "next/link";
import { ChefHat, Mail, Phone, MapPin, Clock } from "lucide-react";
import { getPublicSettings } from "@/lib/settings";

export async function SiteFooter() {
  const s = await getPublicSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-700 text-white">
                <ChefHat className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-semibold text-neutral-900 dark:text-white">
                {s.name}
              </span>
            </Link>
            {s.tagline && (
              <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
                {s.tagline}
              </p>
            )}
          </div>

          {/* Sitemap */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
              Explore
            </h3>
            <Link href="/services" className="text-sm text-neutral-700 hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-400">
              Services
            </Link>
            <Link href="/about" className="text-sm text-neutral-700 hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-400">
              About
            </Link>
            <Link href="/contact" className="text-sm text-neutral-700 hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-400">
              Contact
            </Link>
            <Link href="/book" className="text-sm text-neutral-700 hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-400">
              Book an event
            </Link>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
              Get in touch
            </h3>
            {s.phone && (
              <a href={`tel:${s.phone.replace(/\s+/g, "")}`} className="flex items-start gap-2 text-sm text-neutral-700 hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-400">
                <Phone className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {s.phone}
              </a>
            )}
            {s.email && (
              <a href={`mailto:${s.email}`} className="flex items-start gap-2 text-sm text-neutral-700 hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-400 break-words">
                <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {s.email}
              </a>
            )}
            {s.address && (
              <p className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-neutral-400" />
                <span>{s.address}</span>
              </p>
            )}
            {s.contact.businessHours && (
              <p className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-neutral-400" />
                <span>{s.contact.businessHours}</span>
              </p>
            )}
          </div>

          {/* Social */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">
              Follow
            </h3>
            <div className="flex gap-2">
              {s.socialLinks.facebook && (
                <a
                  href={s.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm font-semibold text-neutral-600 hover:border-amber-700 hover:text-amber-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
                >
                  f
                </a>
              )}
              {s.socialLinks.instagram && (
                <a
                  href={s.socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-600 hover:border-amber-700 hover:text-amber-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
                >
                  ig
                </a>
              )}
              {!s.socialLinks.facebook && !s.socialLinks.instagram && (
                <span className="text-xs text-neutral-400">Social links coming soon</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-neutral-500">
            &copy; {year} {s.name}. All rights reserved.
          </p>
          <p className="text-xs text-neutral-400">
            Crafted with care in Metro Manila.
          </p>
        </div>
      </div>
    </footer>
  );
}
