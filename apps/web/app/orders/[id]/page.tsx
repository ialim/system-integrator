import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Badge, Box, Button, Divider, HStack, Input, Link, Select, Stack, Text } from "@chakra-ui/react";
import {
  createOrderShareLink,
  fetchOrder,
  initializePaystackPayment,
  updateOrderStatus,
  updateOrderTracking
} from "../../../lib/orders";

const formatCurrency = (value: number, currency?: string | null) => {
  if (!Number.isFinite(value)) return "n/a";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0
  });
  return formatter.format(value);
};

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof value === "object" && typeof value.toString === "function") {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const token = cookies().get("token")?.value;
  if (!token) redirect("/auth/login");

  const orderId = Number(params.id);
  let order: Awaited<ReturnType<typeof fetchOrder>> | null = null;
  let error: string | null = null;

  try {
    order = await fetchOrder(token!, orderId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load order";
  }

  const totalValue = toNumber(order?.total ?? 0);
  const latestPayment = order?.payments?.[0];
  const paymentStatus = latestPayment?.status || "UNPAID";
  const isPaid = paymentStatus === "SUCCESS";
  const isPayable = totalValue > 0;
  const shipping =
    order?.shipping && typeof order.shipping === "object"
      ? (order.shipping as Record<string, any>)
      : null;
  const shippingAddress =
    shipping?.address && typeof shipping.address === "object"
      ? (shipping.address as Record<string, any>)
      : null;
  const shippingLine = [shippingAddress?.address1, shippingAddress?.address2]
    .filter(Boolean)
    .join(", ");
  const shippingLocale = [
    shippingAddress?.city,
    shippingAddress?.state,
    shippingAddress?.country
  ]
    .filter(Boolean)
    .join(", ");

  async function updateStatusAction(formData: FormData) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const status = formData.get("status")?.toString();
    if (!status) return;
    await updateOrderStatus(token, orderId, status);
    redirect(`/orders/${orderId}`);
  }

  async function addTrackingAction(formData: FormData) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const nextTracking = formData.get("tracking")?.toString().trim();
    if (!nextTracking) return;
    const current = Array.isArray(order?.tracking) ? order?.tracking : [];
    const merged = [...current, nextTracking];
    await updateOrderTracking(token, orderId, merged);
    redirect(`/orders/${orderId}`);
  }

  async function shareOrderAction() {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const share = await createOrderShareLink(token, orderId);
    redirect(`/shared/orders/${share.shareId}`);
  }

  async function payNowAction() {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const payment = await initializePaystackPayment(token, orderId);
    if (payment.authorization_url) {
      redirect(payment.authorization_url);
    }
    redirect(`/orders/${orderId}?payment=error`);
  }

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="2">
            <HStack spacing="3" justify="space-between" align={{ base: "flex-start", md: "center" }} flexWrap="wrap">
              <Stack spacing="1">
                <Text fontSize="lg" fontWeight="700">
                  Order #{orderId}
                </Text>
                {order && (
                  <HStack spacing="2">
                    <Badge bg="rgba(255,255,255,0.08)" color="var(--accent)" borderRadius="full" px="2">
                      {order.type}
                    </Badge>
                    <Badge bg="rgba(255,255,255,0.08)" color="var(--text)" borderRadius="full" px="2">
                      {order.status}
                    </Badge>
                  </HStack>
                )}
              </Stack>
              <HStack spacing="2" flexWrap="wrap">
                <Button as={Link} href="/orders" variant="outline" borderColor="var(--border)" color="var(--text)">
                  Back to orders
                </Button>
                <form action={shareOrderAction}>
                  <Button variant="outline" borderColor="var(--border)" color="var(--text)" type="submit">
                    Share order
                  </Button>
                </form>
                {!isPaid && isPayable ? (
                  <form action={payNowAction}>
                    <Button bg="var(--primary)" color="#fff" _hover={{ bg: "#1f5ee0" }} type="submit">
                      Pay now
                    </Button>
                  </form>
                ) : null}
              </HStack>
            </HStack>
            {error && <Text color="#f59e0b">{error}</Text>}
          </Stack>
        </Box>

        {order && (
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
            <Stack spacing="3">
              <Stack spacing="1">
                <Text fontWeight="700">Order details</Text>
                <Text color="var(--muted)" fontSize="sm">
                  Project:{" "}
                  <Link href={`/projects/${order.projectId}`} color="var(--accent)">
                    {order.project?.name || `#${order.projectId}`}
                  </Link>
                </Text>
                <Text color="var(--muted)" fontSize="sm">
                  Snapshot: #{order.bomVersionId}
                </Text>
                <Text color="var(--muted)" fontSize="sm">
                  Total: {formatCurrency(totalValue, order?.tax?.currency || order?.shipping?.currency)}
                </Text>
                <Text color="var(--muted)" fontSize="sm">
                  Payment: {paymentStatus}
                </Text>
                <Text color="var(--muted)" fontSize="xs">
                  Created: {new Date(order.createdAt).toLocaleString()}
                </Text>
              </Stack>

              <Divider borderColor="var(--border)" />

              {shippingAddress && (
                <Stack spacing="1">
                  <Text fontWeight="700">Shipping address</Text>
                  {shippingLine && (
                    <Text color="var(--muted)" fontSize="sm">
                      {shippingLine}
                    </Text>
                  )}
                  {shippingLocale && (
                    <Text color="var(--muted)" fontSize="sm">
                      {shippingLocale}
                    </Text>
                  )}
                </Stack>
              )}

              <Stack spacing="2">
                <Text fontWeight="700">Update status</Text>
                <form action={updateStatusAction}>
                  <HStack spacing="2" flexWrap="wrap">
                    <Select
                      name="status"
                      defaultValue={order.status}
                      size="sm"
                      bg="var(--card)"
                      borderColor="var(--border)"
                    >
                      {["DRAFT", "SENT", "ACCEPTED", "FULFILLED", "SHIPPED", "CANCELLED"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                    <Button size="sm" variant="outline" borderColor="var(--border)" color="var(--text)" type="submit">
                      Update
                    </Button>
                  </HStack>
                </form>
              </Stack>

              <Stack spacing="2">
                <Text fontWeight="700">Tracking</Text>
                <form action={addTrackingAction}>
                  <HStack spacing="2" flexWrap="wrap">
                    <Input
                      name="tracking"
                      placeholder="Tracking number"
                      size="sm"
                      bg="var(--card)"
                      borderColor="var(--border)"
                    />
                    <Button size="sm" variant="outline" borderColor="var(--border)" color="var(--text)" type="submit">
                      Add tracking
                    </Button>
                  </HStack>
                </form>
                {Array.isArray(order.tracking) && order.tracking.length ? (
                  <Text color="var(--muted)" fontSize="sm">
                    {order.tracking.map((item: any) => (typeof item === "string" ? item : JSON.stringify(item))).join(", ")}
                  </Text>
                ) : (
                  <Text color="var(--muted)" fontSize="sm">
                    No tracking updates yet.
                  </Text>
                )}
              </Stack>
            </Stack>
          </Box>
        )}
      </Stack>
    </main>
  );
}
