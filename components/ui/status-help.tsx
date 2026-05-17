import type { BookingStatus } from "@/types";

const COPY: Record<BookingStatus, { customer: string; staff: string }> = {
  PENDING: {
    customer: "Waiting for staff to confirm your booking",
    staff: "Review and confirm to move this booking forward",
  },
  CONFIRMED: {
    customer: "Booking confirmed. You can pay now to lock in the date",
    staff: "Confirmed. Customer can now pay to mark this PAID",
  },
  PAID: {
    customer: "Payment received. Your event is locked in",
    staff: "Customer paid. Event will run on the booked date",
  },
  COMPLETED: {
    customer: "Event completed",
    staff: "Event ran successfully",
  },
  CANCELLED: {
    customer: "Booking was cancelled",
    staff: "Booking was cancelled",
  },
};

interface Props {
  status: BookingStatus;
  audience?: "customer" | "staff";
  className?: string;
}

/**
 * One-liner that explains what a status means and what comes next.
 * Used under the badge on booking detail pages.
 */
export function StatusHelp({ status, audience = "customer", className }: Props) {
  const text = COPY[status][audience];
  return (
    <p className={`text-xs text-neutral-500 ${className ?? ""}`}>{text}</p>
  );
}
