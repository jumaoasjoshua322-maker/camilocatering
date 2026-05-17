import { BookingList } from "@/components/shared/booking-list";

export const metadata = { title: "Bookings" };

export default function VendorBookingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Bookings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage and respond to booking requests</p>
      </div>
      <BookingList role="vendor" />
    </div>
  );
}
