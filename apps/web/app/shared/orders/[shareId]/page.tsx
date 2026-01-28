import { Box, Grid, Stack, Text } from "@chakra-ui/react";

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

const getLinePrice = (li: any) => {
  return toNumber(li?.pricing?.effectiveUnitPrice ?? li?.unitPrice ?? li?.product?.msrp ?? li?.product?.unitCost ?? 0);
};

const getLineTotal = (li: any) => {
  const explicit = toNumber(li?.pricing?.lineTotal);
  if (explicit > 0) return explicit;
  return getLinePrice(li) * toNumber(li?.qty ?? 0);
};

export default async function SharedOrderPage({ params }: { params: { shareId: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const res = await fetch(`${apiUrl}/shared/orders/${params.shareId}`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main style={{ minHeight: "80vh" }}>
        <Stack spacing="4">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
            <Text fontSize="lg" fontWeight="700">
              Shared order not found
            </Text>
            <Text color="var(--muted)">This share link may have been removed.</Text>
          </Box>
        </Stack>
      </main>
    );
  }

  const data = await res.json();
  const bomVersion = data?.bomVersion || {};
  const snapshot = bomVersion?.snapshot || {};
  const lineItems = Array.isArray(snapshot?.lineItems) ? snapshot.lineItems : [];
  const totals = bomVersion?.totals || {};
  const project = data?.project || snapshot?.project || {};
  const currency = totals?.currency || lineItems?.[0]?.product?.currency;

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="1">
            <Text fontSize="lg" fontWeight="700">
              {project?.name || "Shared order"}
            </Text>
            <Text color="var(--muted)" fontSize="sm">
              {data?.type || "QUOTE"} #{data?.id} - Status {data?.status}
            </Text>
          </Stack>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Text fontWeight="700" mb="3">
            Line items
          </Text>
          <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(240px, 1fr))" }} gap="3">
            {lineItems.length ? (
              lineItems.map((item: any) => (
                <Box key={item?.id || item?.product?.sku} border="1px solid var(--border)" borderRadius="12px" p="3" bg="var(--card)">
                  <Text fontWeight="600">{item?.product?.name || "Unnamed item"}</Text>
                  <Text color="var(--muted)" fontSize="sm">
                    {item?.product?.sku || "no sku"} - {item?.room?.name || "Unassigned"}
                  </Text>
                  <Text color="var(--muted)" fontSize="sm">
                    Qty {item?.qty || 0} - {formatCurrency(getLineTotal(item), currency)}
                  </Text>
                </Box>
              ))
            ) : (
              <Text color="var(--muted)">No line items found.</Text>
            )}
          </Grid>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Text fontWeight="700" mb="2">
            Totals
          </Text>
          <Stack spacing="1">
            <Text color="var(--muted)" fontSize="sm">
              Subtotal: {formatCurrency(toNumber(totals?.subtotal ?? 0), currency)}
            </Text>
            {totals?.discounts !== undefined && (
              <Text color="var(--muted)" fontSize="sm">
                Discounts: -{formatCurrency(toNumber(totals?.discounts ?? 0), currency)}
              </Text>
            )}
            {totals?.shipping !== undefined && (
              <Text color="var(--muted)" fontSize="sm">
                Shipping: {formatCurrency(toNumber(totals?.shipping ?? 0), currency)}
              </Text>
            )}
            {totals?.tax !== undefined && (
              <Text color="var(--muted)" fontSize="sm">
                Tax: {formatCurrency(toNumber(totals?.tax ?? 0), currency)}
              </Text>
            )}
            <Text color="var(--muted)" fontSize="sm">
              Total: {formatCurrency(toNumber(totals?.total ?? totals?.subtotal ?? 0), currency)}
            </Text>
          </Stack>
        </Box>
      </Stack>
    </main>
  );
}
