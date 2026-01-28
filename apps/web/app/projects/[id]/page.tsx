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
  FormControl,
  FormLabel,
  Grid,
  HStack,
  IconButton,
  Input,
  Link,
  Select,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  addLineItem,
  createBomShareLink,
  createBomSnapshot,
  createRoom,
  deleteProject,
  deleteRoom,
  deleteLineItem,
  fetchProjectDetail,
  renameProject,
  renameRoom,
  updateLineItem,
  updateProject,
} from "../../../lib/projects";
import { fetchClient, fetchClients } from "../../../lib/clients";
import { fetchOrgProfile } from "../../../lib/org";
import { fetchProducts } from "../../../lib/products";
import { ProductSelector } from "../../../components/ProductSelector";
import { AddIcon, DeleteIcon, MinusIcon } from "../../../components/icons";
import { RenameRoomModal } from "../../../components/RenameRoomModal";
import { RenameProjectModal } from "../../../components/RenameProjectModal";
import { ConfirmActionButton } from "../../../components/ConfirmActionButton";
import { EditLineItemModal } from "../../../components/EditLineItemModal";
import { createOrder } from "../../../lib/orders";
const formatCurrency = (value: number, currency?: string | null) => {
  if (!Number.isFinite(value)) return "n/a";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
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
const parsePercent = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(Math.max(parsed, 0), 100);
};
const getLineItemPrice = (li: any) => {
  return toNumber(
    li.pricing?.effectiveUnitPrice ??
      li.unitPrice ??
      li.product?.msrp ??
      li.product?.unitCost ??
      0,
  );
};
export default async function ProjectDetailPage({
  params,
  searchParams,
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
  let clients: Awaited<ReturnType<typeof fetchClients>> | null = null;
  let clientsError: string | null = null;
  let orgProfile: Awaited<ReturnType<typeof fetchOrgProfile>> | null = null;
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
  try {
    clients = await fetchClients(token!, { limit: 200, offset: 0 });
  } catch (err) {
    clientsError =
      err instanceof Error ? err.message : "Failed to load clients";
  }
  try {
    orgProfile = await fetchOrgProfile(token!);
  } catch {
    orgProfile = null;
  }
  const selectedRoomId =
    searchParams?.roomId &&
    project?.rooms?.some((r) => r.id === Number(searchParams.roomId))
      ? Number(searchParams.roomId)
      : project?.rooms?.[0]?.id || null;
  const visibleLineItems =
    selectedRoomId && project
      ? project.lineItems.filter(
          (li) =>
            li.room?.id === selectedRoomId || li.roomId === selectedRoomId,
        )
      : project?.lineItems || [];
  const projectTotal =
    project?.totals?.total ??
    project?.lineItems?.reduce(
      (sum, li) => sum + getLineItemPrice(li) * li.qty,
      0,
    ) ??
    0;
  const projectCurrency =
    project?.totals?.currency ||
    project?.lineItems?.find((li) => li.product?.currency)?.product?.currency ||
    project?.lineItems?.[0]?.product?.currency;
  const roomCounts = (project?.lineItems || []).reduce<Record<number, number>>(
    (acc, li) => {
      if (li.roomId) {
        acc[li.roomId] = (acc[li.roomId] || 0) + li.qty;
      }
      return acc;
    },
    {},
  );
  const selectedRoomName =
    project?.rooms?.find((r) => r.id === selectedRoomId)?.name || "All items";
  const clientMeta =
    project?.clientMeta && typeof project.clientMeta === "object"
      ? (project.clientMeta as Record<string, any>)
      : {};
  const selectedClient =
    clientMeta?.client && typeof clientMeta.client === "object"
      ? (clientMeta.client as Record<string, any>)
      : null;
  const selectedClientId = Number.isFinite(clientMeta?.clientId)
    ? Number(clientMeta.clientId)
    : null;
  const selectedShipping =
    clientMeta?.shipping && typeof clientMeta.shipping === "object"
      ? (clientMeta.shipping as Record<string, any>)
      : clientMeta?.address && typeof clientMeta.address === "object"
        ? (clientMeta.address as Record<string, any>)
        : clientMeta?.shippingAddress &&
            typeof clientMeta.shippingAddress === "object"
          ? (clientMeta.shippingAddress as Record<string, any>)
          : {};
  const shippingLine = [selectedShipping.address1, selectedShipping.address2]
    .filter(Boolean)
    .join(", ");
  const shippingLocale = [
    selectedShipping.city,
    selectedShipping.state,
    selectedShipping.country,
  ]
    .filter(Boolean)
    .join(", ");
  const hasClient = Boolean(
    selectedClient?.name ||
    selectedClient?.email ||
    selectedClient?.phone ||
    shippingLine,
  );
  const clientOptions = clients?.items || [];
  const hasClients = clientOptions.length > 0;
  const proposalMeta =
    project?.proposalMeta && typeof project.proposalMeta === "object"
      ? (project.proposalMeta as Record<string, any>)
      : null;
  const projectMarkupRaw = proposalMeta?.markupPercent;
  const projectMarkupPercent = parsePercent(projectMarkupRaw);
  const orgDefaults =
    orgProfile?.proposalDefaults && typeof orgProfile.proposalDefaults === "object"
      ? (orgProfile.proposalDefaults as Record<string, any>)
      : null;
  const orgMarkupPercent = parsePercent(orgDefaults?.markupPercent);
  const hasProjectMarkup = projectMarkupRaw !== null && projectMarkupRaw !== undefined;
  const effectiveMarkupPercent = hasProjectMarkup ? projectMarkupPercent : orgMarkupPercent;
  const markupLabel =
    effectiveMarkupPercent !== null ? `${effectiveMarkupPercent}%` : "No markup set";
  const markupSourceLabel = hasProjectMarkup
    ? "Project override"
    : orgMarkupPercent !== null
      ? "Using organization default"
      : "Set a default in organization settings.";
  async function renameProjectAction(formData: FormData) {
    "use server";
    const name = formData.get("name")?.toString().trim();
    if (!name) return;
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await renameProject(token, projectId, name);
    redirect(`/projects/${projectId}`);
  }
  async function updateClientSelectionAction(formData: FormData) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const clientIdRaw = formData.get("clientId")?.toString();
    if (!clientIdRaw) return;
    const clientId = Number(clientIdRaw);
    if (!Number.isFinite(clientId)) return;
    const client = await fetchClient(token, clientId);
    const address =
      client?.address && typeof client.address === "object"
        ? (client.address as Record<string, any>)
        : {};
    const nextMeta = {
      ...(clientMeta || {}),
      clientId: client.id,
      client: {
        name: client.name,
        email: client.email || null,
        phone: client.phone || null,
      },
      shipping: {
        ...(clientMeta?.shipping || {}),
        address1: address.address1 || null,
        address2: address.address2 || null,
        city: address.city || null,
        state: address.state || null,
        postalCode: address.postalCode || null,
        country: address.country || null,
      },
    };
    await updateProject(token, projectId, { clientMeta: nextMeta });
    redirect(`/projects/${projectId}`);
  }
  async function updateProposalMarkupAction(formData: FormData) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const raw = formData.get("markupPercent")?.toString().trim() || "";
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const percent = Math.min(Math.max(parsed, 0), 100);
    await updateProject(token, projectId, { proposalMeta: { markupPercent: percent } });
    redirect(`/projects/${projectId}`);
  }
  async function clearProposalMarkupAction() {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await updateProject(token, projectId, { proposalMeta: null });
    redirect(`/projects/${projectId}`);
  }
  async function deleteProjectAction(_: FormData) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await deleteProject(token, projectId);
    redirect("/projects");
  }
  async function createOrderAction(type: "QUOTE" | "PO", bomVersionId: number) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await createOrder(token, { projectId, bomVersionId, type });
    redirect(`/projects/${projectId}`);
  }
  async function createProposalAction() {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const snapshot = await createBomSnapshot(token, projectId);
    const bomVersionId = snapshot?.id;
    if (!bomVersionId) return;
    const share = await createBomShareLink(token, projectId, bomVersionId);
    redirect(`/shared/bom-versions/${share.shareId}`);
  }
  async function shareSnapshotAction(bomVersionId: number) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const share = await createBomShareLink(token, projectId, bomVersionId);
    redirect(`/shared/bom-versions/${share.shareId}`);
  }
  return (
    <main style={{ minHeight: "80vh" }}>
      {" "}
      <Stack spacing="4">
        {" "}
        <Box
          bg="var(--panel)"
          border="1px solid var(--border)"
          borderRadius="16px"
          p="16px 18px"
          className="glow-card"
        >
          {" "}
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap="3"
            flexWrap="wrap"
          >
            {" "}
            <Stack spacing="1">
              {" "}
              <Text
                letterSpacing="0.08em"
                color="var(--muted)"
                fontSize="sm"
                m="0"
              >
                {" "}
                PROJECT BUILDER{" "}
              </Text>{" "}
              <Text as="h1" fontSize="2xl" fontWeight="800" m="0">
                {" "}
                Design your system by room.{" "}
              </Text>{" "}
              <Text color="var(--muted)" m="0">
                {" "}
                Build fast, keep rooms organized, and get a live estimate.{" "}
              </Text>{" "}
              {project && (
                <Text color="var(--muted)" fontSize="sm" m="0">
                  {" "}
                  {project.name} ?? #{project.id}{" "}
                </Text>
              )}{" "}
              {error && (
                <Text color="#f97316" fontWeight="600">
                  {" "}
                  {error}{" "}
                </Text>
              )}{" "}
            </Stack>{" "}
            <HStack spacing="3" align="center" flexWrap="wrap">
              {" "}
              <Box
                border="1px solid var(--border)"
                borderRadius="12px"
                bg="rgba(255,255,255,0.03)"
                px="4"
                py="3"
              >
                {" "}
                <Text color="var(--muted)" fontSize="xs" letterSpacing="0.06em">
                  {" "}
                  ESTIMATE{" "}
                </Text>{" "}
                <Text
                  fontSize="2xl"
                  fontWeight="800"
                  color="#f97316"
                  lineHeight="1.1"
                >
                  {" "}
                  {formatCurrency(projectTotal, projectCurrency)}{" "}
                </Text>{" "}
                {project?.totals && (
                  <Stack spacing="1" mt="2">
                    {" "}
                    <Text fontSize="xs" color="var(--muted)">
                      {" "}
                      Subtotal:{" "}
                      {formatCurrency(
                        toNumber(project.totals.subtotal || 0),
                        projectCurrency,
                      )}{" "}
                    </Text>{" "}
                    <Text fontSize="xs" color="var(--muted)">
                      {" "}
                      Shipping:{" "}
                      {formatCurrency(
                        toNumber(project.totals.shipping || 0),
                        projectCurrency,
                      )}{" "}
                    </Text>{" "}
                    <Text fontSize="xs" color="var(--muted)">
                      {" "}
                      Tax:{" "}
                      {formatCurrency(
                        toNumber(project.totals.tax || 0),
                        projectCurrency,
                      )}{" "}
                    </Text>{" "}
                  </Stack>
                )}{" "}
              </Box>{" "}
              {project && (
                <RenameProjectModal
                  currentName={project.name}
                  action={renameProjectAction}
                />
              )}{" "}
              {project && (
                <ConfirmActionButton
                  action={deleteProjectAction}
                  confirmMessage="Delete this project? This cannot be undone."
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                  leftIcon={<DeleteIcon />}
                >
                  {" "}
                  Delete{" "}
                </ConfirmActionButton>
              )}{" "}
              <Button
                variant="outline"
                borderColor="var(--border)"
                color="var(--text)"
              >
                {" "}
                Save Project{" "}
              </Button>{" "}
              <Button
                as={Link}
                href={`/projects/${projectId}/checkout`}
                bg="var(--primary)"
                color="#fff"
                _hover={{ bg: "#1f5ee0" }}
              >
                {" "}
                Checkout{" "}
              </Button>{" "}
              <form action={createProposalAction}>
                {" "}
                <Button
                  variant="outline"
                  borderColor="var(--border)"
                  color="var(--text)"
                  type="submit"
                >
                  {" "}
                  Create Proposal{" "}
                </Button>{" "}
              </form>{" "}
            </HStack>{" "}
          </Flex>{" "}
        </Box>{" "}
        <Box
          bg="var(--panel)"
          border="1px solid var(--border)"
          borderRadius="16px"
          p="5"
        >
          {" "}
          <Stack spacing="3">
            {" "}
            <Stack spacing="1">
              {" "}
              <Text fontSize="lg" fontWeight="700">
                {" "}
                Client{" "}
              </Text>{" "}
              <Text color="var(--muted)">
                Select a saved client to apply shipping and tax estimates.
              </Text>{" "}
            </Stack>{" "}
            {hasClient ? (
              <Box
                border="1px solid var(--border)"
                borderRadius="12px"
                p="4"
                bg="var(--card)"
              >
                {" "}
                <Stack spacing="1">
                  {" "}
                  <Text fontWeight="700">
                    {selectedClient?.name || "Client"}
                  </Text>{" "}
                  {selectedClient?.email && (
                    <Text color="var(--muted)" fontSize="sm">
                      {" "}
                      {selectedClient.email}{" "}
                    </Text>
                  )}{" "}
                  {selectedClient?.phone && (
                    <Text color="var(--muted)" fontSize="sm">
                      {" "}
                      {selectedClient.phone}{" "}
                    </Text>
                  )}{" "}
                  {shippingLine && (
                    <Text color="var(--muted)" fontSize="sm">
                      {" "}
                      {shippingLine}{" "}
                    </Text>
                  )}{" "}
                  {shippingLocale && (
                    <Text color="var(--muted)" fontSize="sm">
                      {" "}
                      {shippingLocale}{" "}
                    </Text>
                  )}{" "}
                  {project?.totals?.shippingMeta && (
                    <Text color="var(--muted)" fontSize="sm">
                      {" "}
                      Shipping source:{" "}
                      {project.totals.shippingMeta?.source || "auto"}{" "}
                    </Text>
                  )}{" "}
                </Stack>{" "}
              </Box>
            ) : (
              <Text color="var(--muted)">No client selected yet.</Text>
            )}{" "}
            {clientsError && (
              <Text color="#f59e0b" fontWeight="600">
                {" "}
                {clientsError}{" "}
              </Text>
            )}{" "}
            {hasClients ? (
              <form action={updateClientSelectionAction}>
                {" "}
                <Stack spacing="3">
                  {" "}
                  <Select
                    name="clientId"
                    defaultValue={selectedClientId ?? ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  >
                    {" "}
                    <option value="">Select a client</option>{" "}
                    {clientOptions.map((client) => (
                      <option key={client.id} value={client.id}>
                        {" "}
                        {client.name}{" "}
                        {client.email ? ` ??? ${client.email}` : ""}{" "}
                      </option>
                    ))}{" "}
                  </Select>{" "}
                  <HStack spacing="3" flexWrap="wrap">
                    {" "}
                    <Button
                      type="submit"
                      bg="var(--primary)"
                      color="#fff"
                      _hover={{ bg: "#1f5ee0" }}
                    >
                      {" "}
                      Apply client{" "}
                    </Button>{" "}
                    <Button
                      as={Link}
                      href="/clients"
                      variant="outline"
                      borderColor="var(--border)"
                      color="var(--text)"
                    >
                      {" "}
                      Manage clients{" "}
                    </Button>{" "}
                    {selectedClientId ? (
                      <Button
                        as={Link}
                        href={`/clients/${selectedClientId}`}
                        variant="outline"
                        borderColor="var(--border)"
                        color="var(--text)"
                      >
                        {" "}
                        View client{" "}
                      </Button>
                    ) : null}{" "}
                  </HStack>{" "}
                </Stack>{" "}
              </form>
            ) : (
              <HStack spacing="3" flexWrap="wrap">
                {" "}
                <Text color="var(--muted)">No clients available yet.</Text>{" "}
                <Button
                  as={Link}
                  href="/clients"
                  bg="var(--primary)"
                  color="#fff"
                  _hover={{ bg: "#1f5ee0" }}
                >
                  {" "}
                  Add client{" "}
                </Button>{" "}
              </HStack>
            )}{" "}
          </Stack>{" "}
        </Box>{" "}
        <Box
          bg="var(--panel)"
          border="1px solid var(--border)"
          borderRadius="16px"
          p="5"
        >
          {" "}
          <Stack spacing="3">
            {" "}
            <Stack spacing="1">
              {" "}
              <Text fontSize="lg" fontWeight="700">
                {" "}
                Proposal markup{" "}
              </Text>{" "}
              <Text color="var(--muted)">
                Markup applies only to shared proposals, not POs.
              </Text>{" "}
            </Stack>{" "}
            <Box
              border="1px solid var(--border)"
              borderRadius="12px"
              p="4"
              bg="var(--card)"
            >
              {" "}
              <Stack spacing="1">
                {" "}
                <Text fontWeight="700">Current markup</Text>{" "}
                <Text color="var(--muted)" fontSize="sm">
                  {" "}
                  {markupLabel}{" "}
                </Text>{" "}
                <Text color="var(--muted)" fontSize="xs">
                  {" "}
                  {markupSourceLabel}{" "}
                </Text>{" "}
              </Stack>{" "}
            </Box>{" "}
            <Stack spacing="3">
              {" "}
              <form action={updateProposalMarkupAction}>
                {" "}
                <Stack spacing="3" alignItems="flex-start">
                  {" "}
                  <FormControl maxW={{ base: "100%", md: "260px" }}>
                    {" "}
                    <FormLabel color="var(--muted)">Markup (%)</FormLabel>{" "}
                    <Input
                      name="markupPercent"
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      defaultValue={projectMarkupPercent ?? ""}
                      placeholder={
                        orgMarkupPercent !== null ? `${orgMarkupPercent}` : "0"
                      }
                      bg="var(--card)"
                      borderColor="var(--border)"
                    />{" "}
                  </FormControl>{" "}
                  <Button
                    type="submit"
                    bg="var(--primary)"
                    color="#fff"
                    _hover={{ bg: "#1f5ee0" }}
                  >
                    {" "}
                    Save markup{" "}
                  </Button>{" "}
                </Stack>{" "}
              </form>{" "}
              <HStack spacing="3" flexWrap="wrap">
                {" "}
                {hasProjectMarkup ? (
                  <form action={clearProposalMarkupAction}>
                    {" "}
                    <Button
                      type="submit"
                      variant="outline"
                      borderColor="var(--border)"
                      color="var(--text)"
                    >
                      {" "}
                      Use org default{" "}
                    </Button>{" "}
                  </form>
                ) : null}{" "}
                <Button
                  as={Link}
                  href="/settings/organization"
                  variant="outline"
                  borderColor="var(--border)"
                  color="var(--text)"
                >
                  {" "}
                  Org settings{" "}
                </Button>{" "}
              </HStack>{" "}
            </Stack>{" "}
          </Stack>{" "}
        </Box>{" "}
        <Grid
          templateColumns={{ base: "1fr", xl: "280px 1.35fr 360px" }}
          gap="4"
          alignItems="start"
        >
          {" "}
          <RoomsPanel
            projectId={projectId}
            rooms={project?.rooms || []}
            selectedRoomId={selectedRoomId}
            roomCounts={roomCounts}
          />{" "}
          <LineItemsPanel
            projectId={projectId}
            selectedRoomId={selectedRoomId}
            roomName={selectedRoomName}
            lineItems={visibleLineItems}
          />{" "}
          <CatalogPanel
            projectId={projectId}
            selectedRoomId={selectedRoomId}
            products={catalogPreview?.items || []}
            currency={projectCurrency || "USD"}
          />{" "}
        </Grid>{" "}
        <Box
          bg="var(--panel)"
          border="1px solid var(--border)"
          borderRadius="16px"
          p="5"
        >
          {" "}
          <Stack
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            mb="3"
          >
            {" "}
            <Text fontSize="lg" fontWeight="700">
              {" "}
              BOM versions{" "}
            </Text>{" "}
            <HStack spacing="2">
              {" "}
              <Button
                as={Link}
                href={`/projects/${projectId}/compare`}
                size="sm"
                variant="outline"
                borderColor="var(--border)"
                color="var(--text)"
              >
                {" "}
                Compare{" "}
              </Button>{" "}
              <CreateSnapshotButton projectId={projectId} />{" "}
            </HStack>{" "}
          </Stack>{" "}
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(auto-fit, minmax(240px, 1fr))",
            }}
            gap="3"
          >
            {" "}
            {project?.bomVersions?.length ? (
              project.bomVersions.map((b) => (
                <Box
                  key={b.id}
                  border="1px solid var(--border)"
                  borderRadius="12px"
                  p="3"
                  bg="var(--card)"
                >
                  {" "}
                  <Stack spacing="1">
                    {" "}
                    <HStack spacing="2">
                      {" "}
                      <Text fontWeight="700">Snapshot #{b.id}</Text>{" "}
                      {b?.proposalResponse &&
                        typeof b.proposalResponse === "object" &&
                        (b.proposalResponse as Record<string, any>)?.status && (
                          <Badge
                            bg="rgba(255,255,255,0.08)"
                            color="var(--text)"
                            borderRadius="full"
                            px="2"
                          >
                            {" "}
                            {(b.proposalResponse as Record<string, any>).status}{" "}
                          </Badge>
                        )}{" "}
                    </HStack>{" "}
                  </Stack>{" "}
                  <Text color="var(--muted)" fontSize="sm">
                    {" "}
                    {new Date(b.createdAt).toLocaleString()}{" "}
                  </Text>{" "}
                  {b.totals && typeof b.totals === "object" && (
                    <>
                      {" "}
                      {"subtotal" in b.totals && (
                        <Text color="var(--muted)" fontSize="sm">
                          {" "}
                          Subtotal:{" "}
                          {formatCurrency(
                            toNumber((b.totals as any).subtotal || 0),
                            projectCurrency,
                          )}{" "}
                        </Text>
                      )}{" "}
                      {"discounts" in b.totals &&
                      (b.totals as any).discounts ? (
                        <Text color="var(--muted)" fontSize="sm">
                          {" "}
                          Discounts: -
                          {formatCurrency(
                            toNumber((b.totals as any).discounts || 0),
                            projectCurrency,
                          )}{" "}
                        </Text>
                      ) : null}{" "}
                      {"total" in b.totals && (
                        <Text color="var(--muted)" fontSize="sm">
                          {" "}
                          Total:{" "}
                          {formatCurrency(
                            toNumber((b.totals as any).total || 0),
                            projectCurrency,
                          )}{" "}
                        </Text>
                      )}{" "}
                    </>
                  )}{" "}
                  {b.totals && typeof b.totals !== "object" && (
                    <Text color="var(--muted)" fontSize="sm">
                      {" "}
                      {JSON.stringify(b.totals)}{" "}
                    </Text>
                  )}{" "}
                  <HStack spacing="2" mt="2" flexWrap="wrap">
                    {" "}
                    <Button
                      as={Link}
                      href={`/api/projects/${projectId}/bom-versions/${b.id}/export`}
                      size="sm"
                      variant="outline"
                      borderColor="var(--border)"
                      color="var(--text)"
                    >
                      {" "}
                      Export CSV{" "}
                    </Button>{" "}
                    <form action={createOrderAction.bind(null, "QUOTE", b.id)}>
                      {" "}
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="var(--border)"
                        color="var(--text)"
                        type="submit"
                      >
                        {" "}
                        Create Quote{" "}
                      </Button>{" "}
                    </form>{" "}
                    <form action={createOrderAction.bind(null, "PO", b.id)}>
                      {" "}
                      <Button
                        size="sm"
                        bg="var(--primary)"
                        color="#fff"
                        _hover={{ bg: "#1f5ee0" }}
                        type="submit"
                      >
                        {" "}
                        Create PO{" "}
                      </Button>{" "}
                    </form>{" "}
                    <form action={shareSnapshotAction.bind(null, b.id)}>
                      {" "}
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="var(--border)"
                        color="var(--text)"
                        type="submit"
                      >
                        {" "}
                        Share{" "}
                      </Button>{" "}
                    </form>{" "}
                  </HStack>{" "}
                </Box>
              ))
            ) : (
              <Text color="var(--muted)">No snapshots yet.</Text>
            )}{" "}
          </Grid>{" "}
        </Box>{" "}
      </Stack>{" "}
    </main>
  );
}
function RoomsPanel({
  projectId,
  rooms,
  selectedRoomId,
  roomCounts,
}: {
  projectId: number;
  rooms: Array<{ id: number; name: string; notes?: string | null }>;
  selectedRoomId: number | null;
  roomCounts: Record<number, number>;
}) {
  const nextName = `Room ${rooms.length + 1}`;
  return (
    <Box
      bg="var(--panel)"
      border="1px solid var(--border)"
      borderRadius="14px"
      p="4"
      minH="420px"
    >
      {" "}
      <Flex justify="space-between" align="center" mb="3">
        {" "}
        <Text fontWeight="700">Rooms</Text>{" "}
        <AddRoomForm projectId={projectId} compact nextName={nextName} />{" "}
      </Flex>{" "}
      <VStack align="stretch" spacing="2">
        {" "}
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
              {" "}
              <HStack spacing="3">
                {" "}
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={isActive ? "var(--primary)" : "var(--border-strong)"}
                  boxShadow={
                    isActive ? "0 0 0 6px rgba(45,107,255,0.18)" : undefined
                  }
                />{" "}
                <Stack spacing="0">
                  {" "}
                  <Text fontWeight="700">{r.name}</Text>{" "}
                  <Text fontSize="xs" color="var(--muted)">
                    {" "}
                    {roomCounts[r.id] || 0} items{" "}
                  </Text>{" "}
                </Stack>{" "}
              </HStack>{" "}
              <Badge
                bg="var(--card)"
                color="var(--muted)"
                borderRadius="8px"
                px="2"
              >
                {" "}
                Room{" "}
              </Badge>{" "}
            </Flex>
          );
        })}{" "}
        {!rooms.length && (
          <Text color="var(--muted)" fontSize="sm">
            {" "}
            No rooms yet. Add your first room to start assigning products.{" "}
          </Text>
        )}{" "}
      </VStack>{" "}
    </Box>
  );
}
function LineItemsPanel({
  projectId,
  selectedRoomId,
  roomName,
  lineItems,
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
    redirect(
      `/projects/${projectId}${selectedRoomId ? `?roomId=${selectedRoomId}` : ""}`,
    );
  }
  async function editLineItem(lineItemId: number, formData: FormData) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    const notesRaw = formData.get("notes");
    const notes = notesRaw === null ? undefined : notesRaw.toString();
    const unitPriceRaw = formData.get("unitPrice");
    let unitPrice: number | null | undefined = undefined;
    if (unitPriceRaw !== null) {
      const trimmed = unitPriceRaw.toString().trim();
      if (!trimmed) {
        unitPrice = null;
      } else {
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed) || parsed < 0) return;
        unitPrice = parsed;
      }
    }
    await updateLineItem(token, projectId, lineItemId, { notes, unitPrice });
    redirect(
      `/projects/${projectId}${selectedRoomId ? `?roomId=${selectedRoomId}` : ""}`,
    );
  }
  async function removeLine(lineItemId: number) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await deleteLineItem(token, projectId, lineItemId);
    redirect(
      `/projects/${projectId}${selectedRoomId ? `?roomId=${selectedRoomId}` : ""}`,
    );
  }
  async function deleteRoomAction(_: FormData) {
    "use server";
    if (!selectedRoomId) return;
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await deleteRoom(token, projectId, selectedRoomId);
    redirect(`/projects/${projectId}`);
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
    <Box
      bg="#0f1c3a"
      border="1px solid var(--border)"
      borderRadius="16px"
      p="4"
      minH="420px"
    >
      {" "}
      <Flex justify="space-between" align="center" mb="3">
        {" "}
        <Stack spacing="0">
          {" "}
          <Text fontWeight="800" fontSize="lg">
            {" "}
            {roomName}{" "}
          </Text>{" "}
          <Text color="var(--muted)" fontSize="sm">
            {" "}
            {lineItems.length} items{" "}
          </Text>{" "}
        </Stack>{" "}
        <HStack spacing="2">
          {" "}
          {selectedRoomId && (
            <RenameRoomModal currentName={roomName} action={rename} />
          )}{" "}
          {selectedRoomId && (
            <ConfirmActionButton
              action={deleteRoomAction}
              confirmMessage="Delete this room? Items will remain in the project without a room."
              size="sm"
              variant="outline"
              colorScheme="red"
              leftIcon={<DeleteIcon />}
            >
              {" "}
              Delete room{" "}
            </ConfirmActionButton>
          )}{" "}
          <form action={clearRoom}>
            {" "}
            <Button
              size="sm"
              variant="outline"
              colorScheme="red"
              leftIcon={<DeleteIcon />}
              isDisabled={!lineItems.length || !selectedRoomId}
              type="submit"
            >
              {" "}
              Clear Room{" "}
            </Button>{" "}
          </form>{" "}
        </HStack>{" "}
      </Flex>{" "}
      <Stack spacing="3">
        {" "}
        {lineItems.length ? (
          lineItems.map((li) => {
            const price = getLineItemPrice(li);
            const currency = li.product?.currency || "USD";
            const overridePrice =
              li.unitPrice !== null && li.unitPrice !== undefined
                ? toNumber(li.unitPrice)
                : null;
            const discountRate = toNumber(li.pricing?.discountRate ?? 0);
            const hasDiscount = discountRate > 0.0001;
            const editAction = editLineItem.bind(null, li.id);
            return (
              <Box
                key={li.id}
                border="1px solid var(--border)"
                borderRadius="12px"
                p="3.5"
                bg="rgba(255,255,255,0.02)"
              >
                {" "}
                <Flex
                  justify="space-between"
                  align={{ base: "flex-start", md: "center" }}
                  gap="3"
                  flexWrap="wrap"
                >
                  {" "}
                  <HStack spacing="3" align="flex-start">
                    {" "}
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="12px"
                      bg="var(--card)"
                      border="1px solid var(--border)"
                      display="grid"
                      placeItems="center"
                    >
                      {" "}
                      <Text fontWeight="800">
                        {li.product?.name?.slice(0, 1) || "P"}
                      </Text>{" "}
                    </Box>{" "}
                    <Stack spacing="1">
                      {" "}
                      <Text fontWeight="700">
                        {" "}
                        {li.product?.name}{" "}
                        <Text as="span" color="var(--muted)">
                          ({li.product?.sku})
                        </Text>{" "}
                      </Text>{" "}
                      <HStack spacing="2">
                        {" "}
                        <Badge colorScheme="blue" variant="outline">
                          {" "}
                          {li.product?.category || "Uncategorized"}{" "}
                        </Badge>{" "}
                        {li.room && (
                          <Badge colorScheme="purple" variant="subtle">
                            {" "}
                            {li.room.name}{" "}
                          </Badge>
                        )}{" "}
                      </HStack>{" "}
                      {overridePrice !== null && (
                        <Text color="var(--muted)" fontSize="xs">
                          {" "}
                          Override:{" "}
                          {formatCurrency(overridePrice, currency)}{" "}
                        </Text>
                      )}{" "}
                      {hasDiscount && (
                        <Text color="var(--muted)" fontSize="xs">
                          {" "}
                          Discount: {(discountRate * 100).toFixed(1)}%{" "}
                        </Text>
                      )}{" "}
                      {li.notes && (
                        <Text color="var(--muted)" fontSize="xs">
                          {" "}
                          Notes: {li.notes}{" "}
                        </Text>
                      )}{" "}
                    </Stack>{" "}
                  </HStack>{" "}
                  <Stack spacing="2" align="flex-end" minW="220px">
                    {" "}
                    <Text fontWeight="800" color="#f0f4ff">
                      {" "}
                      {formatCurrency(price * li.qty, currency)}{" "}
                    </Text>{" "}
                    <HStack spacing="2">
                      {" "}
                      <EditLineItemModal
                        currentNotes={li.notes}
                        currentUnitPrice={li.unitPrice}
                        action={editAction}
                      />{" "}
                      <form action={changeQty.bind(null, li.id, li.qty - 1)}>
                        {" "}
                        <IconButton
                          aria-label="Decrease quantity"
                          icon={<MinusIcon />}
                          size="sm"
                          variant="outline"
                          borderColor="var(--border)"
                          isDisabled={li.qty <= 1}
                          type="submit"
                        />{" "}
                      </form>{" "}
                      <Box
                        px="2"
                        py="1"
                        borderRadius="10px"
                        bg="var(--card)"
                        border="1px solid var(--border)"
                      >
                        {" "}
                        <Text fontWeight="700">{li.qty}</Text>{" "}
                      </Box>{" "}
                      <form action={changeQty.bind(null, li.id, li.qty + 1)}>
                        {" "}
                        <IconButton
                          aria-label="Increase quantity"
                          icon={<AddIcon />}
                          size="sm"
                          variant="outline"
                          borderColor="var(--border)"
                          type="submit"
                        />{" "}
                      </form>{" "}
                      <form action={removeLine.bind(null, li.id)}>
                        {" "}
                        <IconButton
                          aria-label="Remove line item"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          color="var(--muted)"
                          type="submit"
                        />{" "}
                      </form>{" "}
                    </HStack>{" "}
                  </Stack>{" "}
                </Flex>{" "}
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
            {" "}
            <Stack align="center" spacing="2">
              {" "}
              <Text fontSize="lg" fontWeight="700">
                {" "}
                No products in this room yet.{" "}
              </Text>{" "}
              <Text color="var(--muted)" fontSize="sm">
                {" "}
                Select items from the catalog to add them.{" "}
              </Text>{" "}
            </Stack>{" "}
          </Box>
        )}{" "}
      </Stack>{" "}
    </Box>
  );
}
function CatalogPanel({
  projectId,
  selectedRoomId,
  products,
  currency,
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
    await addLineItem(token, projectId, {
      productId,
      qty,
      roomId: selectedRoomId || undefined,
    });
    redirect(
      `/projects/${projectId}${selectedRoomId ? `?roomId=${selectedRoomId}` : ""}`,
    );
  }
  const groupedByCategory = products.reduce<Record<string, typeof products>>(
    (acc, p) => {
      const key = p.category || "Uncategorized";
      acc[key] = acc[key] || [];
      acc[key].push(p);
      return acc;
    },
    {},
  );
  return (
    <Box
      bg="var(--panel)"
      border="1px solid var(--border)"
      borderRadius="14px"
      p="4"
      minH="420px"
    >
      {" "}
      <Stack spacing="3">
        {" "}
        <Text fontWeight="700">Catalog</Text>{" "}
        <Box
          border="1px solid var(--border)"
          borderRadius="12px"
          p="3"
          bg="var(--card)"
        >
          {" "}
          <Text fontSize="sm" color="var(--muted)" mb="2">
            {" "}
            Quick add{" "}
          </Text>{" "}
          <ProductSelector onSelect={addProduct} variant="list" />{" "}
        </Box>{" "}
        <Divider borderColor="var(--border)" />{" "}
        {products.length === 0 ? (
          <Text color="var(--muted)" fontSize="sm">
            {" "}
            No catalog items yet. Import products to start adding.{" "}
          </Text>
        ) : (
          <Accordion allowMultiple defaultIndex={[0]}>
            {" "}
            {Object.entries(groupedByCategory).map(([category, items]) => (
              <AccordionItem key={category} borderColor="var(--border)">
                {" "}
                <AccordionButton _hover={{ bg: "rgba(255,255,255,0.04)" }}>
                  {" "}
                  <Box as="span" flex="1" textAlign="left" fontWeight="700">
                    {" "}
                    {category}{" "}
                  </Box>{" "}
                  <AccordionIcon />{" "}
                </AccordionButton>{" "}
                <AccordionPanel pb={4}>
                  {" "}
                  <Stack spacing="3">
                    {" "}
                    {items.map((p) => (
                      <Flex
                        key={p.id || p.sku}
                        justify="space-between"
                        align="center"
                      >
                        {" "}
                        <Stack spacing="0.5">
                          {" "}
                          <Text fontWeight="700">{p.name}</Text>{" "}
                          <Text color="var(--muted)" fontSize="sm">
                            {" "}
                            {p.sku}{" "}
                          </Text>{" "}
                        </Stack>{" "}
                        <HStack spacing="3" align="center">
                          {" "}
                          <Text fontWeight="700">
                            {formatCurrency(
                              p.msrp || p.unitCost || 0,
                              p.currency || currency,
                            )}
                          </Text>{" "}
                          <form action={addProduct.bind(null, p.id!, 1)}>
                            {" "}
                            <IconButton
                              aria-label="Add product"
                              icon={<AddIcon />}
                              size="sm"
                              bg="var(--primary)"
                              color="#fff"
                              _hover={{ bg: "#1f5ee0" }}
                              type="submit"
                            />{" "}
                          </form>{" "}
                        </HStack>{" "}
                      </Flex>
                    ))}{" "}
                  </Stack>{" "}
                </AccordionPanel>{" "}
              </AccordionItem>
            ))}{" "}
          </Accordion>
        )}{" "}
      </Stack>{" "}
    </Box>
  );
}
function AddRoomForm({
  projectId,
  compact = false,
  nextName,
}: {
  projectId: number;
  compact?: boolean;
  nextName: string;
}) {
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
      {" "}
      <Button
        type="submit"
        size={compact ? "sm" : "md"}
        leftIcon={<AddIcon />}
        bg="var(--primary)"
        color="#fff"
        _hover={{ bg: "#1f5ee0" }}
      >
        {" "}
        Add room{" "}
      </Button>{" "}
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
      {" "}
      <Button
        type="submit"
        size="sm"
        variant="outline"
        borderColor="var(--border)"
      >
        {" "}
        Create snapshot{" "}
      </Button>{" "}
    </form>
  );
}
