"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Monitor } from "lucide-react";

interface Props {
  /** Active settings tab — drives which public route to preview. */
  tab: string;
  /**
   * Last save timestamp. Updated by the form on successful save; the iframe
   * cache-busts when this changes. Unsaved keystrokes are NOT reflected
   * because the public pages render from the database.
   */
  savedAt: number;
}

const TAB_TO_ROUTE: Record<string, string> = {
  company: "/",
  branding: "/",
  about: "/about",
  contact: "/contact",
  home: "/",
};

const TAB_LABEL: Record<string, string> = {
  company: "Homepage",
  branding: "Homepage",
  about: "About page",
  contact: "Contact page",
  home: "Homepage",
};

export function SettingsPreviewPane({ tab, savedAt }: Props) {
  const route = TAB_TO_ROUTE[tab] ?? "/";
  const label = TAB_LABEL[tab] ?? "Public site";
  const [src, setSrc] = useState(`${route}?_p=${savedAt}`);

  // Refresh when the tab changes or the form was saved.
  useEffect(() => {
    setSrc(`${route}?_p=${savedAt}`);
  }, [route, savedAt]);

  return (
    <div className="hidden lg:flex flex-col h-[calc(100dvh-7rem)] sticky top-24 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60">
        <div className="flex items-center gap-2 min-w-0">
          <Monitor className="h-4 w-4 text-neutral-400 shrink-0" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
            Live preview · {label}
          </span>
        </div>
        <a
          href={route}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open in new tab"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <iframe
        src={src}
        title="Public site preview"
        className="flex-1 w-full bg-white"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
      <p className="px-4 py-2 text-[11px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
        Preview reflects saved content. Save changes to see your edits.
      </p>
    </div>
  );
}
