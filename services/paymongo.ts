const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY!;
const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

interface PaymentIntentData {
  amount: number; // in centavos (e.g., 100000 = PHP 1,000.00)
  currency: string;
  description: string;
  metadata?: Record<string, string>;
}

interface PaymentIntent {
  id: string;
  attributes: {
    amount: number;
    currency: string;
    status: string;
    client_key: string;
    description: string;
    metadata?: Record<string, string>;
  };
}

interface PaymentMethod {
  id: string;
  type: string;
  attributes: {
    type: string;
    billing?: {
      name: string;
      email: string;
      phone?: string;
    };
  };
}

export async function createPaymentIntent(data: PaymentIntentData): Promise<PaymentIntent> {
  const res = await fetch(`${PAYMONGO_API_URL}/payment_intents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: data.amount,
          currency: data.currency,
          payment_method_allowed: ["card", "gcash", "paymaya"],
          payment_method_options: {
            card: { request_three_d_secure: "any" },
          },
          description: data.description,
          statement_descriptor: "CAMILOS CATERING",
          metadata: data.metadata,
        },
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.[0]?.detail || "Failed to create payment intent");
  }

  const json = await res.json();
  return json.data;
}

export async function attachPaymentMethod(
  paymentIntentId: string,
  paymentMethodId: string,
  clientKey: string
): Promise<PaymentIntent> {
  const res = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}/attach`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(clientKey).toString("base64")}`,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          payment_method: paymentMethodId,
          client_key: clientKey,
        },
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.[0]?.detail || "Failed to attach payment method");
  }

  const json = await res.json();
  return json.data;
}

export async function retrievePaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
  const res = await fetch(`${PAYMONGO_API_URL}/payment_intents/${paymentIntentId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString("base64")}`,
    },
  });

  if (!res.ok) throw new Error("Failed to retrieve payment intent");
  const json = await res.json();
  return json.data;
}

export async function createPaymentMethod(data: {
  type: "card" | "gcash" | "paymaya";
  details: {
    card_number?: string;
    exp_month?: number;
    exp_year?: number;
    cvc?: string;
  };
  billing: {
    name: string;
    email: string;
    phone?: string;
  };
}): Promise<PaymentMethod> {
  const res = await fetch(`${PAYMONGO_API_URL}/payment_methods`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(PAYMONGO_PUBLIC_KEY).toString("base64")}`,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          type: data.type,
          details: data.details,
          billing: data.billing,
        },
      },
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.errors?.[0]?.detail || "Failed to create payment method");
  }

  const json = await res.json();
  return json.data;
}

const PAYMONGO_PUBLIC_KEY = process.env.PAYMONGO_PUBLIC_KEY!;
