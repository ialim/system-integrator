import { cookies } from "next/headers";
import { Box, Button, Grid, HStack, Stack, Text, Link, Badge } from "@chakra-ui/react";
import { fetchOrders } from "../../lib/orders";

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

const formatTotal = (value: any) => {
  const normalized = toNumber(value);
  if (!Number.isFinite(normalized)) return "n/a";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
  return formatter.format(normalized);
};

export default async function OrdersPage({
  searchParams
}: {
  searchParams?: { limit?: string; offset?: string; projectId?: string };
}) {
  const token = cookies().get("token")?.value;
  if (!token) {
    return (
      <main style={{ minHeight: "80vh" }}>
        <Stack spacing="4">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
            <Stack spacing="3">
              <Text fontSize="lg" fontWeight="700">
                Orders
              </Text>
              <Text color="var(--muted)">Sign in to view and manage orders.</Text>
              <HStack spacing="2">
                <Button as={Link} href="/auth/login" bg="var(--primary)" color="#fff">
                  Sign in
                </Button>
                <Button as={Link} href="/auth/signup" variant="outline" borderColor="var(--border)" color="var(--text)">
                  Sign up
                </Button>
              </HStack>
            </Stack>
          </Box>
        </Stack>
      </main>
    );
  }

  const limit = searchParams?.limit ? Number(searchParams.limit) : 12;
  const offset = searchParams?.offset ? Number(searchParams.offset) : 0;
  const projectId = searchParams?.projectId ? Number(searchParams.projectId) : undefined;

  let data: { items: any[]; total: number } | null = null;
  let error: string | null = null;
  try {
    data = await fetchOrders(token, { limit, offset, projectId });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load orders";
  }

  const titleSuffix = projectId ? ` · Project #${projectId}` : "";

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack direction="row" justify="space-between" align="center" mb="3">
            <Box>
              <Text fontSize="lg" fontWeight="700">
                Orders{titleSuffix}
              </Text>
              <Text color="var(--muted)">Track quotes, POs, and payment status</Text>
            </Box>
            <Text color="var(--accent)" fontWeight="600">
              {data ? `${data.total} orders` : ""}
            </Text>
          </Stack>
          {error && <Text color="#f59e0b">{error}</Text>}
          <Grid templateColumns="repeat(auto-fit, minmax(260px, 1fr))" gap="3">
            {data?.items?.map((order) => {
              const totalValue = toNumber(order.total ?? 0);
              const paymentStatus = order.payments?.[0]?.status;
              return (
                <Box key={order.id} bg="var(--card)" border="1px solid var(--border)" borderRadius="12px" p="4">
                  <Stack spacing="2">
                    <HStack justify="space-between" align="center">
                      <Text fontWeight="700">Order #{order.id}</Text>
                      <Badge bg="rgba(255,255,255,0.08)" color="var(--accent)" borderRadius="full" px="2">
                        {order.type}
                      </Badge>
                    </HStack>
                    <Text color="var(--muted)" fontSize="sm">
                      Project:{" "}
                      <Link href={`/projects/${order.projectId}`} color="var(--accent)">
                        {order.project?.name || `#${order.projectId}`}
                      </Link>
                    </Text>
                    <Text color="var(--muted)" fontSize="sm">
                      Status: {order.status}
                    </Text>
                    <Text color="var(--muted)" fontSize="sm">
                      Total: {formatTotal(totalValue)}
                    </Text>
                    {paymentStatus && (
                      <Text color="var(--muted)" fontSize="sm">
                        Payment: {paymentStatus}
                      </Text>
                    )}
                    <Button
                      as={Link}
                      href={`/orders/${order.id}`}
                      size="sm"
                      variant="outline"
                      borderColor="var(--border)"
                      color="var(--text)"
                      alignSelf="flex-start"
                    >
                      View order
                    </Button>
                    <Text color="var(--muted)" fontSize="xs">
                      Created: {new Date(order.createdAt).toLocaleString()}
                    </Text>
                  </Stack>
                </Box>
              );
            })}
            {!data && !error && <Text color="var(--muted)">Loading orders...</Text>}
            {data && data.items.length === 0 && <Text color="var(--muted)">No orders yet.</Text>}
          </Grid>
          {data && <Pagination total={data.total} limit={limit} offset={offset} projectId={projectId} />}
        </Box>
      </Stack>
    </main>
  );
}

function Pagination({
  total,
  limit,
  offset,
  projectId
}: {
  total: number;
  limit: number;
  offset: number;
  projectId?: number;
}) {
  const nextOffset = offset + limit < total ? offset + limit : null;
  const prevOffset = offset - limit >= 0 ? offset - limit : null;
  const buildHref = (o: number | null) => {
    if (o === null) return undefined;
    const params = new URLSearchParams();
    params.set("offset", String(o));
    params.set("limit", String(limit));
    if (projectId) params.set("projectId", String(projectId));
    return `/orders?${params.toString()}`;
  };

  return (
    <HStack mt="4" spacing="3">
      <Button
        as="a"
        href={prevOffset !== null ? buildHref(prevOffset) : undefined}
        isDisabled={prevOffset === null}
        variant="outline"
        color="var(--text)"
        borderColor="var(--border)"
      >
        Prev
      </Button>
      <Text color="var(--muted)">
        Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
      </Text>
      <Button
        as="a"
        href={nextOffset !== null ? buildHref(nextOffset) : undefined}
        isDisabled={nextOffset === null}
        variant="outline"
        color="var(--text)"
        borderColor="var(--border)"
      >
        Next
      </Button>
    </HStack>
  );
}
