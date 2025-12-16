import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Grid,
  HStack,
  IconButton,
  Link,
  Stack,
  Text,
  VStack
} from "@chakra-ui/react";
import {
  addLineItem,
  createBomSnapshot,
  createRoom,
  deleteLineItem,
  fetchProjectDetail,
  renameRoom,
  updateLineItem
} from "../../../lib/projects";
import { fetchProducts } from "../../../lib/products";
import { ProductSelector } from "../../../components/ProductSelector";
import { AddIcon, DeleteIcon, EditIcon, MinusIcon } from "../../../components/icons";
import { RenameRoomModal } from "../../../components/RenameRoomModal";

const formatCurrency = (value: number, currency?: string | null) => {
  if (!Number.isFinite(value)) return "—";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0
  });
  return formatter.format(value);
};

const getLineItemPrice = (li: any) => {
  return (li.product?.msrp ?? li.product?.unitCost ?? li.unitPrice ?? 0) as number;
};

export default async function ProjectDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { roomId?: string };
}) {
  const token = cookies().get("token")?.value;
  if (!token) redirect("/auth/login");

  const projectId = Number(params.id);
  let project: Awaited<ReturnType<typeof fetchProjectDetail>> | null = null;
  let error: string | null = null;
  let catalogPreview: Awaited<ReturnType<typeof fetchProducts>> | null = null;

  try {
    project = await fetchProjectDetail(token!, projectId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load project";
  }

  try {
    catalogPreview = await fetchProducts({ limit: 12 });
  } catch {
    catalogPreview = null;
  }

  const selectedRoomId =
    searchParams?.roomId && project?.rooms?.some((r) => r.id === Number(searchParams.roomId))
      ? Number(searchParams.roomId)
      : project?.rooms?.[0]?.id || null;

  const visibleLineItems =
    selectedRoomId && project
      ? project.lineItems.filter((li) => li.room?.id === selectedRoomId || li.roomId === selectedRoomId)
      : project?.lineItems || [];

  const projectTotal = project?.lineItems?.reduce((sum, li) => sum + getLineItemPrice(li) * li.qty, 0) || 0;
  const projectCurrency =
    project?.lineItems?.find((li) => li.product?.currency)?.product?.currency || project?.lineItems?.[0]?.product?.currency;

  const roomCounts = (project?.lineItems || []).reduce<Record<number, number>>((acc, li) => {
    if (li.roomId) {
      acc[li.roomId] = (acc[li.roomId] || 0) + li.qty;
    }
    return acc;
  }, {});

  const selectedRoomName = project?.rooms?.find((r) => r.id === selectedRoomId)?.name || "All items";

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box
          bg="var(--panel)"
          border="1px solid var(--border)"
          borderRadius="16px"
          p="16px 18px"
          className="glow-card"
        >
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap="3" flexWrap="wrap">
            <Stack spacing="1">
              <Text letterSpacing="0.08em" color="var(--muted)" fontSize="sm" m="0">
                PROJECT BUILDER
              </Text>
              <Text as="h1" fontSize="2xl" fontWeight="800" m="0">
                Design your system by room.
              </Text>
              <Text color="var(--muted)" m="0">
                Build fast, keep rooms organized, and get a live estimate.
              </Text>
              {error && (
                <Text color="#f97316" fontWeight="600">
                  {error}
                </Text>
              )}
            </Stack>
            <HStack spacing="3" align="center">
              <Box
                border="1px solid var(--border)"
                borderRadius="12px"
                bg="rgba(255,255,255,0.03)"
                px="4"
                py="3"
              >
                <Text color="var(--muted)" fontSize="xs" letterSpacing="0.06em">
                  ESTIMATE
                </Text>
                <Text fontSize="2xl" fontWeight="800" color="#f97316" lineHeight="1.1">
                  {formatCurrency(projectTotal, projectCurrency)}
                </Text>
              </Box>
              <Button variant="outline" borderColor="var(--border)" color="var(--text)">
                Save Project
              </Button>
              <Button bg="var(--primary)" color="#fff" _hover={{ bg: "#1f5ee0" }}>
                Checkout
              </Button>
              <Button variant="outline" borderColor="var(--border)" color="var(--text)">
                Create Proposal
              </Button>
            </HStack>
          </Flex>
        </Box>

        <Grid templateColumns={{ base: "1fr", xl: "280px 1.35fr 360px" }} gap="4" alignItems="start">
          <RoomsPanel projectId={projectId} rooms={project?.rooms || []} selectedRoomId={selectedRoomId} roomCounts={roomCounts} />

          <LineItemsPanel
            projectId={projectId}
            selectedRoomId={selectedRoomId}
            roomName={selectedRoomName}
            lineItems={visibleLineItems}
          />

          <CatalogPanel
            projectId={projectId}
            selectedRoomId={selectedRoomId}
            products={catalogPreview?.items || []}
            currency={projectCurrency || "USD"}
          />
        </Grid>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "flex-start", md: "center" }} mb="3">
            <Text fontSize="lg" fontWeight="700">
              BOM versions
            </Text>
            <CreateSnapshotButton projectId={projectId} />
          </Stack>
          <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(240px, 1fr))" }} gap="3">
            {project?.bomVersions?.length ? (
              project.bomVersions.map((b) => (
                <Box key={b.id} border="1px solid var(--border)" borderRadius="12px" p="3" bg="var(--card)">
                  <Text fontWeight="700">Snapshot #{b.id}</Text>
                  <Text color="var(--muted)" fontSize="sm">
                    {new Date(b.createdAt).toLocaleString()}
                  </Text>
                  {b.totals && (
                    <Text color="var(--muted)" fontSize="sm">
                      Subtotal:{" "}
                      {typeof b.totals === "object" && "subtotal" in b.totals
                        ? formatCurrency((b.totals as any).subtotal || 0, projectCurrency)
                        : JSON.stringify(b.totals)}
                    </Text>
                  )}
                </Box>
              ))
            ) : (
              <Text color="var(--muted)">No snapshots yet.</Text>
            )}
          </Grid>
        </Box>
      </Stack>
    </main>
  );
}

function RoomsPanel({
  projectId,
  rooms,
  selectedRoomId,
  roomCounts
}: {
  projectId: number;
  rooms: Array<{ id: number; name: string; notes?: string | null }>;
  selectedRoomId: number | null;
  roomCounts: Record<number, number>;
}) {
  const nextName = `Room ${rooms.length + 1}`;
  return (
    <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="4" minH="420px">
      <Flex justify="space-between" align="center" mb="3">
        <Text fontWeight="700">Rooms</Text>
        <AddRoomForm projectId={projectId} compact nextName={nextName} />
      </Flex>
      <VStack align="stretch" spacing="2">
        {rooms.map((r) => {
          const isActive = selectedRoomId === r.id;
          return (
            <Flex
              key={r.id}
              as={Link}
              href={`/projects/${projectId}?roomId=${r.id}`}
              align="center"
              justify="space-between"
              bg={isActive ? "rgba(45,107,255,0.18)" : "rgba(255,255,255,0.02)"}
              border="1px solid"
              borderColor={isActive ? "var(--primary)" : "var(--border)"}
              borderRadius="12px"
              px="3"
              py="2.5"
              _hover={{ borderColor: "var(--primary)" }}
            >
              <HStack spacing="3">
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={isActive ? "var(--primary)" : "var(--border-strong)"}
                  boxShadow={isActive ? "0 0 0 6px rgba(45,107,255,0.18)" : undefined}
                />
                <Stack spacing="0">
                  <Text fontWeight="700">{r.name}</Text>
                  <Text fontSize="xs" color="var(--muted)">
                    {roomCounts[r.id] || 0} items
                  </Text>
                </Stack>
              </HStack>
              <Badge bg="var(--card)" color="var(--muted)" borderRadius="8px" px="2">
                Room
              </Badge>
            </Flex>
          );
        })}
        {!rooms.length && (
          <Text color="var(--muted)" fontSize="sm">
            No rooms yet. Add your first room to start assigning products.
          </Text>
        )}
      </VStack>
    </Box>
  );
}

function LineItemsPanel({
  projectId,
  selectedRoomId,
  roomName,
  lineItems
}: {
  projectId: number;
  selectedRoomId: number | null;
  roomName: string;
  lineItems: any[];
}) {
  async function changeQty(lineItemId: number, nextQty: number) {
    "use server";
    if (nextQty < 1) return;
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await updateLineItem(token, projectId, lineItemId, { qty: nextQty });
    redirect(`/projects/${projectId}${selectedRoomId ? `?roomId=${selectedRoomId}` : ""}`);
  }

  async function removeLine(lineItemId: number) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await deleteLineItem(token, projectId, lineItemId);
    redirect(`/projects/${projectId}${selectedRoomId ? `?roomId=${selectedRoomId}` : ""}`);
  }

  async function clearRoom() {
    "use server";
    if (!selectedRoomId) return;
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const items = lineItems || [];
    for (const li of items) {
      await deleteLineItem(token, projectId, li.id);
    }
    redirect(`/projects/${projectId}?roomId=${selectedRoomId}`);
  }

  async function rename(formData: FormData) {
    "use server";
    const name = formData.get("name")?.toString().trim();
    if (!name || !selectedRoomId) return;
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await renameRoom(token, projectId, selectedRoomId, name);
    redirect(`/projects/${projectId}?roomId=${selectedRoomId}`);
  }

  return (
    <Box bg="#0f1c3a" border="1px solid var(--border)" borderRadius="16px" p="4" minH="420px">
      <Flex justify="space-between" align="center" mb="3">
        <Stack spacing="0">
          <Text fontWeight="800" fontSize="lg">
            {roomName}
          </Text>
          <Text color="var(--muted)" fontSize="sm">
            {lineItems.length} items
          </Text>
        </Stack>
        <HStack spacing="2">
          {selectedRoomId && <RenameRoomModal currentName={roomName} action={rename} />}
          <form action={clearRoom}>
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              leftIcon={<DeleteIcon />}
              isDisabled={!lineItems.length || !selectedRoomId}
              type="submit"
            >
              Clear Room
            </Button>
          </form>
        </HStack>
      </Flex>
      <Stack spacing="3">
        {lineItems.length ? (
          lineItems.map((li) => {
            const price = getLineItemPrice(li);
            const currency = li.product?.currency || "USD";
            return (
              <Box key={li.id} border="1px solid var(--border)" borderRadius="12px" p="3.5" bg="rgba(255,255,255,0.02)">
                <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap="3" flexWrap="wrap">
                  <HStack spacing="3" align="flex-start">
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="12px"
                      bg="var(--card)"
                      border="1px solid var(--border)"
                      display="grid"
                      placeItems="center"
                    >
                      <Text fontWeight="800">{li.product?.name?.slice(0, 1) || "P"}</Text>
                    </Box>
                    <Stack spacing="1">
                      <Text fontWeight="700">
                        {li.product?.name} <Text as="span" color="var(--muted)">({li.product?.sku})</Text>
                      </Text>
                      <HStack spacing="2">
                        <Badge colorScheme="blue" variant="outline">
                          {li.product?.category || "Uncategorized"}
                        </Badge>
                        {li.room && (
                          <Badge colorScheme="purple" variant="subtle">
                            {li.room.name}
                          </Badge>
                        )}
                      </HStack>
                    </Stack>
                  </HStack>
                  <Stack spacing="2" align="flex-end" minW="220px">
                    <Text fontWeight="800" color="#f0f4ff">
                      {formatCurrency(price * li.qty, currency)}
                    </Text>
                    <HStack spacing="2">
                      <form action={changeQty.bind(null, li.id, li.qty - 1)}>
                        <IconButton
                          aria-label="Decrease quantity"
                          icon={<MinusIcon />}
                          size="sm"
                          variant="outline"
                          borderColor="var(--border)"
                          isDisabled={li.qty <= 1}
                          type="submit"
                        />
                      </form>
                      <Box px="2" py="1" borderRadius="10px" bg="var(--card)" border="1px solid var(--border)">
                        <Text fontWeight="700">{li.qty}</Text>
                      </Box>
                      <form action={changeQty.bind(null, li.id, li.qty + 1)}>
                        <IconButton
                          aria-label="Increase quantity"
                          icon={<AddIcon />}
                          size="sm"
                          variant="outline"
                          borderColor="var(--border)"
                          type="submit"
                        />
                      </form>
                      <form action={removeLine.bind(null, li.id)}>
                        <IconButton
                          aria-label="Remove line item"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          color="var(--muted)"
                          type="submit"
                        />
                      </form>
                    </HStack>
                  </Stack>
                </Flex>
              </Box>
            );
          })
        ) : (
          <Box
            mt="3"
            w="100%"
            border="1px dashed var(--border)"
            borderRadius="12px"
            display="grid"
            placeItems="center"
            py="12"
            bg="rgba(255,255,255,0.02)"
          >
            <Stack align="center" spacing="2">
              <Text fontSize="lg" fontWeight="700">
                No products in this room yet.
              </Text>
              <Text color="var(--muted)" fontSize="sm">
                Select items from the catalog to add them.
              </Text>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

function CatalogPanel({
  projectId,
  selectedRoomId,
  products,
  currency
}: {
  projectId: number;
  selectedRoomId: number | null;
  products: Array<any>;
  currency?: string | null;
}) {
  async function addProduct(productId: number, qty: number) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await addLineItem(token, projectId, { productId, qty, roomId: selectedRoomId || undefined });
    redirect(`/projects/${projectId}${selectedRoomId ? `?roomId=${selectedRoomId}` : ""}`);
  }

  const groupedByCategory = products.reduce<Record<string, typeof products>>((acc, p) => {
    const key = p.category || "Uncategorized";
    acc[key] = acc[key] || [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="4" minH="420px">
      <Stack spacing="3">
        <Text fontWeight="700">Catalog</Text>
        <Box border="1px solid var(--border)" borderRadius="12px" p="3" bg="var(--card)">
          <Text fontSize="sm" color="var(--muted)" mb="2">
            Quick add
          </Text>
          <ProductSelector onSelect={addProduct} variant="list" />
        </Box>
        <Divider borderColor="var(--border)" />
        {products.length === 0 ? (
          <Text color="var(--muted)" fontSize="sm">
            No catalog items yet. Import products to start adding.
          </Text>
        ) : (
          <Accordion allowMultiple defaultIndex={[0]}>
            {Object.entries(groupedByCategory).map(([category, items]) => (
              <AccordionItem key={category} borderColor="var(--border)">
                <AccordionButton _hover={{ bg: "rgba(255,255,255,0.04)" }}>
                  <Box as="span" flex="1" textAlign="left" fontWeight="700">
                    {category}
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Stack spacing="3">
                    {items.map((p) => (
                      <Flex key={p.id || p.sku} justify="space-between" align="center">
                        <Stack spacing="0.5">
                          <Text fontWeight="700">{p.name}</Text>
                          <Text color="var(--muted)" fontSize="sm">
                            {p.sku}
                          </Text>
                        </Stack>
                        <HStack spacing="3" align="center">
                          <Text fontWeight="700">{formatCurrency(p.msrp || p.unitCost || 0, p.currency || currency)}</Text>
                          <form action={addProduct.bind(null, p.id!, 1)}>
                            <IconButton
                              aria-label="Add product"
                              icon={<AddIcon />}
                              size="sm"
                              bg="var(--primary)"
                              color="#fff"
                              _hover={{ bg: "#1f5ee0" }}
                              type="submit"
                            />
                          </form>
                        </HStack>
                      </Flex>
                    ))}
                  </Stack>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Stack>
    </Box>
  );
}

function AddRoomForm({ projectId, compact = false, nextName }: { projectId: number; compact?: boolean; nextName: string }) {
  async function action() {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const name = nextName || "New Room";
    await createRoom(token!, projectId, name);
    redirect(`/projects/${projectId}`);
  }
  return (
    <form action={action}>
      <Button
        type="submit"
        size={compact ? "sm" : "md"}
        leftIcon={<AddIcon />}
        bg="var(--primary)"
        color="#fff"
        _hover={{ bg: "#1f5ee0" }}
      >
        Add room
      </Button>
    </form>
  );
}

function CreateSnapshotButton({ projectId }: { projectId: number }) {
  async function action() {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await createBomSnapshot(token!, projectId);
    redirect(`/projects/${projectId}`);
  }
  return (
    <form action={action} style={{ marginBottom: "0.75rem" }}>
      <Button type="submit" size="sm" variant="outline" borderColor="var(--border)">
        Create snapshot
      </Button>
    </form>
  );
}
