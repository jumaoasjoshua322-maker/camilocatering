import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import { BookingForm } from "./booking-form";

interface Props {
  searchParams: Promise<{ packageId?: string }>;
}

export const metadata = { title: "Book a Service" };

export default async function BookingPage({ searchParams }: Props) {
  const { packageId } = await searchParams;

  await connectDB();
  const packages = await Package.find({ isActive: true }).sort({ isFeatured: -1, price: 1 }).lean();

  if (packages.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-neutral-500">No packages available at the moment. Please check back soon.</p>
      </div>
    );
  }

  const serialized = packages.map((p) => ({
    _id: p._id.toString(),
    name: p.name,
    description: p.description,
    category: p.category,
    price: p.price,
    minGuests: p.minGuests,
    maxGuests: p.maxGuests,
    inclusions: p.inclusions,
    imageUrl: p.imageUrl,
    isFeatured: p.isFeatured,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.18em] text-amber-700 font-semibold mb-2">
          Book your event
        </p>
        <h1 className="font-display text-4xl sm:text-5xl text-neutral-900 dark:text-white mb-3">
          Let's plan something memorable
        </h1>
        <p className="text-neutral-500">
          Choose a package, share your event details, and we'll confirm within 24 hours.
        </p>
      </header>
      <BookingForm packages={serialized} defaultPackageId={packageId} />
    </div>
  );
}
