import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import { ChefHat } from "lucide-react";
import { FilterPillLink } from "@/components/ui/filter-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { PackageCard } from "@/components/shared/package-card";
import type { PackageCategory } from "@/types";

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export const metadata = { title: "Our Services" };

export default async function ServicesPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const categories: PackageCategory[] = ["WEDDING", "CORPORATE", "BIRTHDAY", "SOCIAL", "OTHER"];
  const selectedCategory = categories.includes(category as PackageCategory)
    ? (category as PackageCategory)
    : undefined;

  await connectDB();
  const query: { isActive: boolean; category?: PackageCategory } = { isActive: true };
  if (selectedCategory) query.category = selectedCategory;
  const packages = await Package.find(query).sort({ isFeatured: -1, price: 1 }).lean();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <header className="mb-10 sm:mb-12 max-w-2xl">
        <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 dark:text-white mb-3">
          Our packages
        </h1>
        <p className="text-neutral-500">
          Browse our complete range of catering packages for every occasion.
        </p>
      </header>

      {/* Category Filter — left-aligned, scrolls on mobile */}
      <div className="-mx-4 sm:mx-0 mb-8 sm:mb-10 overflow-x-auto">
        <div className="flex gap-2 px-4 sm:px-0 min-w-max sm:min-w-0 sm:flex-wrap">
          <FilterPillLink href="/services" active={!selectedCategory}>
            All packages
          </FilterPillLink>
          {categories.map((cat) => (
            <FilterPillLink
              key={cat}
              href={`/services?category=${cat}`}
              active={selectedCategory === cat}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </FilterPillLink>
          ))}
        </div>
      </div>

      {/* Package Grid */}
      {packages.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="No packages available in this category"
          description="Try a different category or browse all packages."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg._id.toString()}
              pkg={{
                _id: pkg._id.toString(),
                name: pkg.name,
                description: pkg.description,
                category: pkg.category as PackageCategory,
                price: pkg.price,
                minGuests: pkg.minGuests,
                maxGuests: pkg.maxGuests,
                inclusions: pkg.inclusions,
                imageUrl: pkg.imageUrl,
                isFeatured: pkg.isFeatured,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
