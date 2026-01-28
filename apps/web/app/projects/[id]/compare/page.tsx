import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Button, Grid, HStack, Link, Select, Stack, Text } from "@chakra-ui/react";
import { fetchBomVersionDetail, fetchProjectDetail } from "../../../../lib/projects";

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

const lineKey = (li: any, index: number) => {
  return li?.id ?? li?.product?.sku ?? `${li?.product?.name ?? "item"}-${index}`;
};

const getLinePrice = (li: any) => {
  return toNumber(li?.pricing?.effectiveUnitPrice ?? li?.unitPrice ?? li?.product?.msrp ?? li?.product?.unitCost ?? 0);
};

const getLineTotal = (li: any) => {
  const explicit = toNumber(li?.pricing?.lineTotal);
  if (explicit > 0) return explicit;
  return getLinePrice(li) * toNumber(li?.qty ?? 0);
};

export default async function CompareSnapshotsPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { from?: string; to?: string };
}) {
  const token = cookies().get("token")?.value;
  if (!token) redirect("/auth/login");

  const projectId = Number(params.id);
  const project = await fetchProjectDetail(token!, projectId);
  const versions = project?.bomVersions || [];

  const sortedVersions = [...versions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latest = sortedVersions[0];
  const previous = sortedVersions[1];

  const fromId = Number(searchParams?.from || previous?.id || latest?.id || 0) || null;
  const toId = Number(searchParams?.to || latest?.id || previous?.id || 0) || null;

  if (!fromId || !toId) {
    return (
      <main style={{ minHeight: "80vh" }}>
        <Stack spacing="4">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
            <Text fontSize="lg" fontWeight="700">
              Snapshot comparison
            </Text>
            <Text color="var(--muted)">
              You need at least one BOM snapshot to compare. Create a snapshot first.
            </Text>
            <Button as={Link} href={`/projects/${projectId}`} mt="3" variant="outline" borderColor="var(--border)" color="var(--text)">
              Back to project
            </Button>
          </Box>
        </Stack>
      </main>
    );
  }

  const [fromSnapshot, toSnapshot] = await Promise.all([
    fetchBomVersionDetail(token!, projectId, fromId),
    fetchBomVersionDetail(token!, projectId, toId)
  ]);

  const fromItems = Array.isArray(fromSnapshot?.snapshot?.lineItems) ? fromSnapshot.snapshot.lineItems : [];
  const toItems = Array.isArray(toSnapshot?.snapshot?.lineItems) ? toSnapshot.snapshot.lineItems : [];

  const fromMap = new Map<string | number, any>();
  const toMap = new Map<string | number, any>();

  fromItems.forEach((li: any, index: number) => {
    fromMap.set(lineKey(li, index), li);
  });
  toItems.forEach((li: any, index: number) => {
    toMap.set(lineKey(li, index), li);
  });

  const added: any[] = [];
  const removed: any[] = [];
  const changed: Array<{
    key: string | number;
    from: any;
    to: any;
    changes: Array<{ label: string; from: string; to: string }>;
  }> = [];

  for (const [key, fromItem] of fromMap.entries()) {
    const toItem = toMap.get(key);
    if (!toItem) {
      removed.push(fromItem);
      continue;
    }
    const differences: Array<{ label: string; from: string; to: string }> = [];
    if (toNumber(fromItem.qty) !== toNumber(toItem.qty)) {
      differences.push({
        label: "Qty",
        from: String(fromItem.qty ?? ""),
        to: String(toItem.qty ?? "")
      });
    }
    if (getLinePrice(fromItem) !== getLinePrice(toItem)) {
      differences.push({
        label: "Unit price",
        from: String(getLinePrice(fromItem)),
        to: String(getLinePrice(toItem))
      });
    }
    const fromRoom = fromItem?.room?.name || "";
    const toRoom = toItem?.room?.name || "";
    if (fromRoom !== toRoom) {
      differences.push({
        label: "Room",
        from: fromRoom || "Unassigned",
        to: toRoom || "Unassigned"
      });
    }
    if ((fromItem?.notes || "") !== (toItem?.notes || "")) {
      differences.push({
        label: "Notes",
        from: fromItem?.notes || "",
        to: toItem?.notes || ""
      });
    }
    if (differences.length) {
      changed.push({ key, from: fromItem, to: toItem, changes: differences });
    }
  }

  for (const [key, toItem] of toMap.entries()) {
    if (!fromMap.has(key)) {
      added.push(toItem);
    }
  }

  const currency = toSnapshot?.totals?.currency || project?.lineItems?.[0]?.product?.currency;
  const fromTotals = fromSnapshot?.totals || {};
  const toTotals = toSnapshot?.totals || {};

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="1">
            <Text fontSize="lg" fontWeight="700">
              Snapshot comparison
            </Text>
            <Text color="var(--muted)">
              Compare BOM changes between two snapshots for {project?.name}.
            </Text>
          </Stack>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <form>
            <Stack spacing="3">
              <HStack spacing="3" align="center" flexWrap="wrap">
                <Stack spacing="1" minW="240px">
                  <Text color="var(--muted)" fontSize="sm">
                    From snapshot
                  </Text>
                  <Select name="from" defaultValue={String(fromId)} bg="var(--card)" borderColor="var(--border)">
                    {sortedVersions.map((version) => (
                      <option key={version.id} value={version.id}>
                        #{version.id} - {new Date(version.createdAt).toLocaleString()}
                      </option>
                    ))}
                  </Select>
                </Stack>
                <Stack spacing="1" minW="240px">
                  <Text color="var(--muted)" fontSize="sm">
                    To snapshot
                  </Text>
                  <Select name="to" defaultValue={String(toId)} bg="var(--card)" borderColor="var(--border)">
                    {sortedVersions.map((version) => (
                      <option key={version.id} value={version.id}>
                        #{version.id} - {new Date(version.createdAt).toLocaleString()}
                      </option>
                    ))}
                  </Select>
                </Stack>
                <Button type="submit" variant="outline" borderColor="var(--border)" color="var(--text)">
                  Compare
                </Button>
                <Button as={Link} href={`/projects/${projectId}`} variant="ghost">
                  Back to project
                </Button>
              </HStack>
            </Stack>
          </form>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="4">
            <Text fontWeight="700">From #{fromId}</Text>
            <Text color="var(--muted)" fontSize="sm">
              Subtotal: {formatCurrency(toNumber(fromTotals?.subtotal ?? 0), currency)}
            </Text>
            <Text color="var(--muted)" fontSize="sm">
              Total: {formatCurrency(toNumber(fromTotals?.total ?? fromTotals?.subtotal ?? 0), currency)}
            </Text>
          </Box>
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="4">
            <Text fontWeight="700">To #{toId}</Text>
            <Text color="var(--muted)" fontSize="sm">
              Subtotal: {formatCurrency(toNumber(toTotals?.subtotal ?? 0), currency)}
            </Text>
            <Text color="var(--muted)" fontSize="sm">
              Total: {formatCurrency(toNumber(toTotals?.total ?? toTotals?.subtotal ?? 0), currency)}
            </Text>
          </Box>
        </Grid>

        <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap="3">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="4">
            <Text fontWeight="700">Added ({added.length})</Text>
            <Stack spacing="2" mt="2">
              {added.length ? (
                added.map((item, idx) => (
                  <Box key={`${item?.id ?? idx}-added`} border="1px solid var(--border)" borderRadius="12px" p="3" bg="var(--card)">
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
                <Text color="var(--muted)" fontSize="sm">
                  No new items.
                </Text>
              )}
            </Stack>
          </Box>
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="4">
            <Text fontWeight="700">Removed ({removed.length})</Text>
            <Stack spacing="2" mt="2">
              {removed.length ? (
                removed.map((item, idx) => (
                  <Box key={`${item?.id ?? idx}-removed`} border="1px solid var(--border)" borderRadius="12px" p="3" bg="var(--card)">
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
                <Text color="var(--muted)" fontSize="sm">
                  No removals.
                </Text>
              )}
            </Stack>
          </Box>
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="4">
            <Text fontWeight="700">Updated ({changed.length})</Text>
            <Stack spacing="2" mt="2">
              {changed.length ? (
                changed.map((entry) => (
                  <Box key={`${entry.key}-changed`} border="1px solid var(--border)" borderRadius="12px" p="3" bg="var(--card)">
                    <Text fontWeight="600">{entry.to?.product?.name || entry.from?.product?.name || "Unnamed item"}</Text>
                    <Text color="var(--muted)" fontSize="sm">
                      {entry.to?.product?.sku || entry.from?.product?.sku || "no sku"}
                    </Text>
                    <Stack spacing="1" mt="2">
                      {entry.changes.map((change, idx) => (
                        <Text key={`${entry.key}-${idx}`} color="var(--muted)" fontSize="sm">
                          {change.label}: {change.from || "n/a"} {"->"} {change.to || "n/a"}
                        </Text>
                      ))}
                    </Stack>
                  </Box>
                ))
              ) : (
                <Text color="var(--muted)" fontSize="sm">
                  No changes detected.
                </Text>
              )}
            </Stack>
          </Box>
        </Grid>
      </Stack>
    </main>
  );
}
