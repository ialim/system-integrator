const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export type Order = {
  id: number;
  projectId: number;
  bomVersionId: number;
  type: string;
  status: string;
  total?: number | null;
  shipping?: any | null;
  tax?: any | null;
  tracking?: any[] | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: number; name: string };
  bomVersion?: { id: number; createdAt: string };
  payments?: Array<{
    id: number;
    provider: string;
    status: string;
    amount: number;
    currency: string;
    reference: string;
    authorizationUrl?: string | null;
    createdAt: string;
  }>;
};

export async function fetchOrders(
  token: string,
  params?: { projectId?: number; limit?: number; offset?: number }
) {
  const search = new URLSearchParams();
  if (params?.projectId) search.set("projectId", String(params.projectId));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.offset) search.set("offset", String(params.offset));

  const res = await fetch(`${API_URL}/orders${search.toString() ? `?${search.toString()}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Failed to fetch orders (${res.status})`);
  return (await res.json()) as { items: Order[]; total: number };
}

export async function fetchOrder(token: string, orderId: number) {
  const res = await fetch(`${API_URL}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) throw new Error(`Failed to fetch order (${res.status})`);
  return res.json() as Promise<Order>;
}

export async function createOrder(
  token: string,
  body: {
    projectId: number;
    bomVersionId: number;
    type?: "QUOTE" | "PO";
    shipping?: Record<string, any> | null;
    tax?: Record<string, any> | null;
    total?: number;
  }
) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Failed to create order (${res.status})`);
  return res.json();
}

export async function updateOrderStatus(token: string, orderId: number, status: string) {
  const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error(`Failed to update order status (${res.status})`);
  return res.json();
}

export async function updateOrderTracking(token: string, orderId: number, tracking: any[]) {
  const res = await fetch(`${API_URL}/orders/${orderId}/tracking`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ tracking })
  });
  if (!res.ok) throw new Error(`Failed to update order tracking (${res.status})`);
  return res.json();
}

export async function createOrderShareLink(token: string, orderId: number) {
  const res = await fetch(`${API_URL}/orders/${orderId}/share`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to create share link (${res.status})`);
  return res.json() as Promise<{ shareId: string }>;
}

export async function initializePaystackPayment(token: string, orderId: number) {
  const res = await fetch(`${API_URL}/orders/${orderId}/payments/paystack/initialize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to initialize Paystack payment (${res.status})`);
  return res.json() as Promise<{ authorization_url: string; reference: string }>;
}

export async function verifyPaystackPayment(reference: string) {
  const res = await fetch(`${API_URL}/payments/paystack/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference })
  });
  if (!res.ok) throw new Error(`Failed to verify Paystack payment (${res.status})`);
  return res.json();
}
