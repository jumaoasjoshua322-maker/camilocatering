import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ChefHat } from "lucide-react";
import Link from "next/link";
import type { PackageCategory } from "@/types";

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export const metadata = { title: "Our Services" };

const categoryColors: Record<PackageCategory, string> = {
  WEDDING: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
  CORPORATE: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  BIRTHDAY: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  SOCIAL: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  OTHER: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400",
};

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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">Our Services</h1>
        <p className="text-neutral-500 max-w-2xl mx-auto">
          Browse our complete range of catering packages for every occasion
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <Link
          href="/services"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory
              ? "bg-amber-600 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
          }`}
        >
          All Packages
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/services?category=${cat}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-amber-600 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Package Grid */}
      {packages.length === 0 ? (
        <div className="text-center py-24">
          <ChefHat className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No packages available in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg._id.toString()} className="group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {pkg.name}
                    </h3>
                    <Badge className={`mt-2 ${categoryColors[pkg.category as PackageCategory]}`}>
                      {pkg.category}
                    </Badge>
                    {pkg.isFeatured && (
                      <Badge variant="default" className="ml-2 mt-2">Featured</Badge>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-amber-600">{formatCurrency(pkg.price)}</div>
                  </div>
                </div>

                <p className="text-sm text-neutral-500 line-clamp-2">{pkg.description}</p>

                <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                  <Users className="h-4 w-4" />
                  {pkg.minGuests}–{pkg.maxGuests} guests
                </div>

                {pkg.inclusions.length > 0 && (
                  <ul className="flex flex-col gap-1.5">
                    {pkg.inclusions.slice(0, 4).map((inc, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                        <span className="h-1 w-1 rounded-full bg-amber-500 flex-shrink-0" />
                        {inc}
                      </li>
                    ))}
                    {pkg.inclusions.length > 4 && (
                      <li className="text-xs text-neutral-400">+{pkg.inclusions.length - 4} more</li>
                    )}
                  </ul>
                )}

                <Link
                  href={`/book?packageId=${pkg._id.toString()}`}
                  className="mt-auto inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  Book This Package
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
