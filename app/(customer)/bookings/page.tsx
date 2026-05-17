import { BookingList } from "@/components/shared/booking-list";

export const metadata = { title: "My Bookings" };

export default function CustomerBookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
          My Bookings
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Track all your catering event bookings
        </p>
      </div>
      <BookingList role="customer" />
    </div>
  );
}
