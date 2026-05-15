import { PackageManager } from "./package-manager";

export const metadata = { title: "Packages" };

export default function PackagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Packages</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage catering packages and pricing</p>
      </div>
      <PackageManager />
    </div>
  );
}
