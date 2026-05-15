import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import { BookingForm } from "./booking-form";

interface Props {
  searchParams: Promise<{ packageId?: string }>;
}

export const metadata = { title: "Book a Service — Camilo Catering" };

export default async function BookingPage({ searchParams }: Props) {
  const { packageId } = await searchParams;

  await connectDB();
  const packages = await Package.find({ isActive: true }).sort({ price: 1 }).lean();

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
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm text-amber-600 font-medium mb-2">Ready to celebrate?</p>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Book a Catering Service</h1>
        <p className="text-neutral-500 mt-2">Select a package and fill in your event details below.</p>
      </div>
      <BookingForm packages={serialized} defaultPackageId={packageId} />
    </div>
  );
}
