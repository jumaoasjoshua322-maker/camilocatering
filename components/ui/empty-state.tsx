import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Consistent empty-state block used across dashboards and lists.
 * Pattern: dashed border + soft icon + title + optional description + optional CTA.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-12",
        "rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800",
        "bg-neutral-50/40 dark:bg-neutral-900/30",
        className
      )}
    >
      <div className="h-12 w-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-neutral-400" />
      </div>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-xs text-neutral-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
