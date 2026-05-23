/**
 * PayMongo HTTP client.
 *
 * We use the Checkout Sessions API: PayMongo hosts the full payment UI
 * (card / GCash / PayMaya), handles 3DS, and notifies us via webhook
 * when payment succeeds. The webhook handler in
 * `app/api/payments/webhook/route.ts` is the source of truth for
 * flipping a booking to PAID — never trust the success_url redirect.
 *
 * @see https://developers.paymongo.com/reference/create-a-checkout-session
 */

const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

function getSecretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) throw new Error("PAYMONGO_SECRET_KEY is not configured");
  return key;
}

function basicAuth(): string {
  return `Basic ${Buffer.from(getSecretKey()).toString("base64")}`;
}

export interface CheckoutSessionInput {
  /** Amount in centavos. PHP 1,000.00 = 100000. */
  amount: number;
  /** Human-readable description shown on the PayMongo page. */
  description: string;
  /** Where to send the customer after success or cancel. */
  successUrl: string;
  cancelUrl: string;
  /** Echoed back on the webhook. Use this to find the booking. */
  metadata: { bookingId: string };
  /** Customer info pre-filled on the page. */
  billing?: { name?: string; email?: string; phone?: string };
  /** What to show as line items on the hosted page. */
  lineItem: { name: string; quantity: number };
}

export interface CheckoutSession {
  id: string;
  attributes: {
    checkout_url: string;
    payment_intent: { id: string; attributes: { client_key: string } } | null;
    status: string;
  };
}

/**
 * Create a hosted checkout session and return the URL to redirect to.
 *
 * Amount is in centavos (smallest currency unit), per PayMongo convention.
 * `metadata.bookingId` is echoed back on the webhook so we can correlate
 * the event to a booking without trusting client-side data.
 */
export async function createCheckoutSession(
  input: CheckoutSessionInput
): Promise<CheckoutSession> {
  const res = await fetch(`${PAYMONGO_API_URL}/checkout_sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(),
    },
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              name: input.lineItem.name,
              amount: input.amount,
              currency: "PHP",
              quantity: input.lineItem.quantity,
            },
          ],
          payment_method_types: ["card", "gcash", "paymaya"],
          description: input.description,
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          billing: input.billing,
          metadata: input.metadata,
        },
      },
    }),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = (await res.json()) as { errors?: { detail?: string }[] };
      if (json.errors?.[0]?.detail) detail = json.errors[0].detail;
    } catch {
      /* response wasn't JSON; keep status fallback */
    }
    throw new Error(`PayMongo checkout session failed: ${detail}`);
  }

  const json = (await res.json()) as { data: CheckoutSession };
  return json.data;
}
