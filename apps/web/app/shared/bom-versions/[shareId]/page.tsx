import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  HStack,
  Input,
  Stack,
  Text,
  Textarea
} from "@chakra-ui/react";
import { redirect } from "next/navigation";
import { ProposalActions } from "../../../../components/ProposalActions";

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

const normalizePercent = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "string" && !value.trim()) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(parsed, 0), 100);
};

const getLinePrice = (li: any) => {
  return toNumber(li?.pricing?.effectiveUnitPrice ?? li?.unitPrice ?? li?.product?.msrp ?? li?.product?.unitCost ?? 0);
};

const getLineTotal = (li: any) => {
  const explicit = toNumber(li?.pricing?.lineTotal);
  if (explicit > 0) return explicit;
  return getLinePrice(li) * toNumber(li?.qty ?? 0);
};

const toText = (value: FormDataEntryValue | null) => value?.toString().trim() || "";

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
};

export default async function SharedBomVersionPage({
  params,
  searchParams
}: {
  params: { shareId: string };
  searchParams?: { status?: string; error?: string };
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
  const res = await fetch(`${apiUrl}/shared/bom-versions/${params.shareId}`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <main style={{ minHeight: "80vh" }}>
        <Stack spacing="4">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
            <Text fontSize="lg" fontWeight="700">
              Proposal not found
            </Text>
            <Text color="var(--muted)">This share link may have expired.</Text>
          </Box>
        </Stack>
      </main>
    );
  }

  const data = await res.json();
  const snapshot = data?.snapshot || {};
  const lineItems = Array.isArray(snapshot?.lineItems) ? snapshot.lineItems : [];
  const totals = data?.totals || {};
  const project = data?.project || snapshot?.project || {};
  const org = data?.org || {};
  const orgDefaults = org?.proposalDefaults && typeof org.proposalDefaults === "object" ? (org.proposalDefaults as Record<string, any>) : {};
  const currency = totals?.currency || lineItems?.[0]?.product?.currency;

  const proposalStatus = data?.proposal?.status || "PENDING";
  const proposalResponse = data?.proposal?.response || null;

  const markupPercent = normalizePercent(data?.proposal?.markupPercent ?? 0);
  const markupFactor = markupPercent > 0 ? 1 + markupPercent / 100 : 1;
  const baseSubtotal = toNumber(totals?.subtotal ?? 0);
  const proposalSubtotal = baseSubtotal * markupFactor;
  const markupAmount = proposalSubtotal - baseSubtotal;
  const proposalTotal =
    proposalSubtotal + toNumber(totals?.shipping ?? 0) + toNumber(totals?.tax ?? 0);

  const clientMeta = project?.clientMeta && typeof project.clientMeta === "object" ? (project.clientMeta as Record<string, any>) : {};
  const client = clientMeta?.client && typeof clientMeta.client === "object" ? (clientMeta.client as Record<string, any>) : {};
  const clientShipping =
    clientMeta?.shipping && typeof clientMeta.shipping === "object" ? (clientMeta.shipping as Record<string, any>) : {};
  const clientLine = [clientShipping.address1, clientShipping.address2].filter(Boolean).join(", ");
  const clientLocale = [clientShipping.city, clientShipping.state, clientShipping.country].filter(Boolean).join(", ");

  const rooms = new Set(lineItems.map((li: any) => li?.room?.name).filter(Boolean));
  const itemCount = lineItems.reduce((sum: number, li: any) => sum + toNumber(li?.qty ?? 0), 0);

  const brandColor = orgDefaults?.brandColor || "#2d6bff";
  const logoUrl = orgDefaults?.logoUrl;
  const contactEmail = orgDefaults?.contactEmail || orgDefaults?.email;
  const contactPhone = orgDefaults?.contactPhone || orgDefaults?.phone;
  const website = orgDefaults?.website;
  const introNote = orgDefaults?.introNote || orgDefaults?.note;
  const terms = orgDefaults?.terms || org?.paymentTerms;

  async function respondAction(formData: FormData) {
    "use server";
    const status = formData.get("status")?.toString();
    if (!status) return;
    const name = toText(formData.get("name"));
    const email = toText(formData.get("email"));
    const note = toText(formData.get("note"));
    const payload = {
      status,
      name: name || undefined,
      email: email || undefined,
      note: note || undefined
    };
    const response = await fetch(`${apiUrl}/shared/bom-versions/${params.shareId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      redirect(`/shared/bom-versions/${params.shareId}?error=Unable%20to%20record%20response`);
    }
    const next = status === "ACCEPTED" ? "accepted" : "declined";
    redirect(`/shared/bom-versions/${params.shareId}?status=${next}`);
  }

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4" className="proposal-shell">
        <Box
          border="1px solid"
          borderColor="var(--border)"
          borderRadius="24px"
          bg="linear-gradient(135deg, rgba(15,28,54,0.95), rgba(17,25,48,0.85))"
          overflow="hidden"
          position="relative"
        >
          <Box
            position="absolute"
            inset="-120px"
            bg={`radial-gradient(180px at 15% 20%, ${brandColor}33, transparent 55%), radial-gradient(180px at 80% 10%, rgba(124,58,237,0.22), transparent 55%)`}
            opacity={0.8}
            pointerEvents="none"
          />
          <Stack spacing="4" p={{ base: "6", md: "8" }} position="relative">
            <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} flexWrap="wrap" gap="4">
              <HStack spacing="4" align="center">
                {logoUrl ? (
                  <Box
                    as="img"
                    src={logoUrl}
                    alt={`${org?.name || "Organization"} logo`}
                    maxW="64px"
                    maxH="64px"
                    objectFit="contain"
                    borderRadius="12px"
                    bg="rgba(255,255,255,0.08)"
                    p="2"
                  />
                ) : (
                  <Box
                    width="56px"
                    height="56px"
                    borderRadius="16px"
                    bg={brandColor}
                    display="grid"
                    placeItems="center"
                    color="#fff"
                    fontWeight="800"
                    fontSize="lg"
                  >
                    {(org?.name || "SI").slice(0, 2).toUpperCase()}
                  </Box>
                )}
                <Stack spacing="1">
                  <Text fontSize="xl" fontWeight="800">
                    {org?.name || "Smart Integrator"}
                  </Text>
                  <Text color="var(--muted)" fontSize="sm">
                    {org?.businessAddress?.address1 || "Proposal team"}
                  </Text>
                  <HStack spacing="2" flexWrap="wrap">
                    {contactEmail && (
                      <Badge bg="rgba(255,255,255,0.08)" color="var(--text)" borderRadius="full">
                        {contactEmail}
                      </Badge>
                    )}
                    {contactPhone && (
                      <Badge bg="rgba(255,255,255,0.08)" color="var(--text)" borderRadius="full">
                        {contactPhone}
                      </Badge>
                    )}
                    {website && (
                      <Badge bg="rgba(255,255,255,0.08)" color="var(--text)" borderRadius="full">
                        {website}
                      </Badge>
                    )}
                  </HStack>
                </Stack>
              </HStack>
              <Stack spacing="2" align={{ base: "flex-start", md: "flex-end" }}>
                <Badge bg="rgba(255,255,255,0.14)" color="var(--text)" borderRadius="full" px="3" py="1">
                  Proposal #{data?.id}
                </Badge>
                <Text fontSize="sm" color="var(--muted)">
                  Issued {formatDateTime(data?.createdAt)}
                </Text>
                <Text fontSize="2xl" fontWeight="800" color={brandColor}>
                  {formatCurrency(proposalTotal, currency)}
                </Text>
              </Stack>
            </Flex>

            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="4">
              <Box border="1px solid var(--border)" borderRadius="16px" p="4" bg="rgba(15,26,48,0.6)">
                <Text color="var(--muted)" fontSize="xs">
                  Project
                </Text>
                <Text fontWeight="700">{project?.name || "Shared project"}</Text>
                <Text fontSize="sm" color="var(--muted)">
                  {rooms.size || 0} rooms, {itemCount} items
                </Text>
              </Box>
              <Box border="1px solid var(--border)" borderRadius="16px" p="4" bg="rgba(15,26,48,0.6)">
                <Text color="var(--muted)" fontSize="xs">
                  Prepared for
                </Text>
                <Text fontWeight="700">{client?.name || "Client"}</Text>
                <Text fontSize="sm" color="var(--muted)">
                  {client?.email || client?.phone || "Client contact"}
                </Text>
              </Box>
              <Box border="1px solid var(--border)" borderRadius="16px" p="4" bg="rgba(15,26,48,0.6)">
                <Text color="var(--muted)" fontSize="xs">
                  Snapshot
                </Text>
                <Text fontWeight="700">#{data?.id}</Text>
                <Text fontSize="sm" color="var(--muted)">
                  {markupPercent > 0 ? `Includes ${markupPercent.toFixed(1)}% markup` : "No markup applied"}
                </Text>
              </Box>
            </Grid>

            {introNote && (
              <Box border="1px solid var(--border)" borderRadius="16px" p="4" bg="rgba(15,26,48,0.6)">
                <Text color="var(--muted)" fontSize="sm">
                  {introNote}
                </Text>
              </Box>
            )}
          </Stack>
        </Box>

        <Flex justify="space-between" align="center" flexWrap="wrap" gap="3">
          <Stack spacing="1">
            <Text fontSize="lg" fontWeight="700">
              Proposal details
            </Text>
            <Text color="var(--muted)">Review each item and confirm the totals.</Text>
          </Stack>
          <ProposalActions />
        </Flex>

        {(searchParams?.status || searchParams?.error) && (
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="4">
            {searchParams?.status === "accepted" && (
              <Text color="var(--success)">Thanks for accepting this proposal.</Text>
            )}
            {searchParams?.status === "declined" && (
              <Text color="var(--warning)">Response recorded. We will follow up shortly.</Text>
            )}
            {searchParams?.error && <Text color="#f59e0b">{searchParams.error}</Text>}
          </Box>
        )}

        <Grid templateColumns={{ base: "1fr", xl: "2fr 1fr" }} gap="4">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="20px" p="5">
            <Text fontWeight="700" mb="3">
              Line items
            </Text>
            <Stack spacing="3">
              {lineItems.length ? (
                lineItems.map((item: any) => {
                  const lineTotal = getLineTotal(item) * markupFactor;
                  const unitPrice = item?.qty ? lineTotal / toNumber(item.qty) : lineTotal;
                  return (
                    <Box key={item?.id || item?.product?.sku} border="1px solid var(--border)" borderRadius="16px" p="4" bg="var(--card)">
                      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr 1fr" }} gap="3" alignItems="center">
                        <Stack spacing="1">
                          <Text fontWeight="700">{item?.product?.name || "Unnamed item"}</Text>
                          <Text color="var(--muted)" fontSize="sm">
                            {item?.product?.sku || "no sku"} {item?.room?.name ? `- ${item.room.name}` : ""}
                          </Text>
                          {item?.notes && (
                            <Text color="var(--muted)" fontSize="xs">
                              Notes: {item.notes}
                            </Text>
                          )}
                        </Stack>
                        <Stack spacing="1">
                          <Text color="var(--muted)" fontSize="xs">
                            Qty
                          </Text>
                          <Text fontWeight="700">{item?.qty || 0}</Text>
                        </Stack>
                        <Stack spacing="1" alignItems={{ base: "flex-start", md: "flex-end" }}>
                          <Text color="var(--muted)" fontSize="xs">
                            Proposal price
                          </Text>
                          <Text fontWeight="800">{formatCurrency(unitPrice, currency)}</Text>
                          <Text color="var(--muted)" fontSize="sm">
                            Line total {formatCurrency(lineTotal, currency)}
                          </Text>
                        </Stack>
                      </Grid>
                    </Box>
                  );
                })
              ) : (
                <Text color="var(--muted)">No line items found.</Text>
              )}
            </Stack>
          </Box>

          <Stack spacing="4">
            <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="20px" p="5">
              <Text fontWeight="700" mb="3">
                Pricing summary
              </Text>
              <Stack spacing="2">
                <Flex justify="space-between">
                  <Text color="var(--muted)">Subtotal</Text>
                  <Text fontWeight="700">{formatCurrency(proposalSubtotal, currency)}</Text>
                </Flex>
                {markupPercent > 0 && (
                  <Flex justify="space-between">
                    <Text color="var(--muted)">Markup</Text>
                    <Text fontWeight="700">
                      {formatCurrency(markupAmount, currency)} ({markupPercent.toFixed(1)}%)
                    </Text>
                  </Flex>
                )}
                <Flex justify="space-between">
                  <Text color="var(--muted)">Shipping</Text>
                  <Text fontWeight="700">{formatCurrency(toNumber(totals?.shipping ?? 0), currency)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text color="var(--muted)">Tax</Text>
                  <Text fontWeight="700">{formatCurrency(toNumber(totals?.tax ?? 0), currency)}</Text>
                </Flex>
                <Divider borderColor="var(--border)" />
                <Flex justify="space-between">
                  <Text fontWeight="700">Total</Text>
                  <Text fontWeight="800" color={brandColor}>
                    {formatCurrency(proposalTotal, currency)}
                  </Text>
                </Flex>
              </Stack>
            </Box>

            {(client?.name || clientLine || clientLocale) && (
              <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="20px" p="5">
                <Text fontWeight="700" mb="2">
                  Client details
                </Text>
                <Stack spacing="1">
                  {client?.name && <Text>{client.name}</Text>}
                  {client?.email && <Text color="var(--muted)">{client.email}</Text>}
                  {client?.phone && <Text color="var(--muted)">{client.phone}</Text>}
                  {clientLine && <Text color="var(--muted)">{clientLine}</Text>}
                  {clientLocale && <Text color="var(--muted)">{clientLocale}</Text>}
                </Stack>
              </Box>
            )}

            {terms && (
              <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="20px" p="5">
                <Text fontWeight="700" mb="2">
                  Terms
                </Text>
                <Text color="var(--muted)" fontSize="sm">
                  {terms}
                </Text>
              </Box>
            )}
          </Stack>
        </Grid>

        <Box
          bg="var(--panel)"
          border="1px solid var(--border)"
          borderRadius="20px"
          p="5"
          className="proposal-acceptance"
        >
          <Stack spacing="4">
            <Stack spacing="1">
              <Text fontWeight="700">Acceptance</Text>
              <Text color="var(--muted)" fontSize="sm">
                Confirm if you would like to proceed with this proposal.
              </Text>
            </Stack>

            {proposalStatus !== "PENDING" && (
              <Box border="1px solid var(--border)" borderRadius="14px" p="4" bg="var(--card)">
                <Stack spacing="1">
                  <HStack spacing="2">
                    <Badge bg="rgba(255,255,255,0.08)" color="var(--text)" borderRadius="full">
                      {proposalStatus}
                    </Badge>
                    <Text color="var(--muted)" fontSize="sm">
                      {formatDateTime(proposalResponse?.respondedAt)}
                    </Text>
                  </HStack>
                  {(proposalResponse?.name || proposalResponse?.email) && (
                    <Text color="var(--muted)" fontSize="sm">
                      {proposalResponse?.name || "Client"} {proposalResponse?.email ? `(${proposalResponse.email})` : ""}
                    </Text>
                  )}
                  {proposalResponse?.note && (
                    <Text color="var(--muted)" fontSize="sm">
                      Note: {proposalResponse.note}
                    </Text>
                  )}
                </Stack>
              </Box>
            )}

            {proposalStatus === "PENDING" && (
              <form action={respondAction}>
                <Stack spacing="3">
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3">
                    <Input name="name" placeholder="Your name" bg="var(--card)" borderColor="var(--border)" />
                    <Input name="email" type="email" placeholder="Email address" bg="var(--card)" borderColor="var(--border)" />
                  </Grid>
                  <Textarea
                    name="note"
                    placeholder="Optional note"
                    bg="var(--card)"
                    borderColor="var(--border)"
                    rows={3}
                  />
                  <HStack spacing="3" flexWrap="wrap">
                    <Button
                      type="submit"
                      name="status"
                      value="ACCEPTED"
                      bg={brandColor}
                      color="#fff"
                      _hover={{ opacity: 0.9 }}
                    >
                      Accept proposal
                    </Button>
                    <Button type="submit" name="status" value="DECLINED" variant="outline" borderColor="var(--border)" color="var(--text)">
                      Decline
                    </Button>
                  </HStack>
                </Stack>
              </form>
            )}
          </Stack>
        </Box>
      </Stack>
    </main>
  );
}
