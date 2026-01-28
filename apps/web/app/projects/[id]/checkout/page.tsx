import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Input,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { createBomSnapshot, fetchProjectDetail } from "../../../../lib/projects";
import { fetchOrgProfile } from "../../../../lib/org";
import { createOrder } from "../../../../lib/orders";

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

const toText = (value: FormDataEntryValue | null) => {
  const text = value?.toString().trim() || "";
  return text.length ? text : null;
};

export default async function ProjectCheckoutPage({ params }: { params: { id: string } }) {
  const token = cookies().get("token")?.value;
  if (!token) redirect("/auth/login");

  const projectId = Number(params.id);
  let project: Awaited<ReturnType<typeof fetchProjectDetail>> | null = null;
  let orgProfile: Awaited<ReturnType<typeof fetchOrgProfile>> | null = null;
  let error: string | null = null;

  try {
    project = await fetchProjectDetail(token!, projectId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load project";
  }

  try {
    orgProfile = await fetchOrgProfile(token!);
  } catch {
    orgProfile = null;
  }

  const businessAddress =
    orgProfile?.businessAddress && typeof orgProfile.businessAddress === "object"
      ? (orgProfile.businessAddress as Record<string, any>)
      : {};

  const totals = project?.totals || {};
  const currency = totals?.currency || project?.lineItems?.[0]?.product?.currency;
  const shippingCost = toNumber(totals?.shipping ?? 0);
  const taxCost = toNumber(totals?.tax ?? 0);
  const totalCost = toNumber(totals?.total ?? totals?.subtotal ?? 0);

  async function checkoutAction(formData: FormData) {
    "use server";
    const tokenValue = cookies().get("token")?.value;
    if (!tokenValue) redirect("/auth/login");

    const address = {
      address1: toText(formData.get("address1")),
      address2: toText(formData.get("address2")),
      city: toText(formData.get("city")),
      state: toText(formData.get("state")),
      postalCode: toText(formData.get("postalCode")),
      country: toText(formData.get("country")),
    };
    const hasAddress = Object.values(address).some((value) => value);

    const shipping = {
      address: hasAddress ? address : null,
      cost: shippingCost,
      currency: totals?.currency || null,
      meta: totals?.shippingMeta || null,
    };

    const snapshot = await createBomSnapshot(tokenValue, projectId);
    const bomVersionId = snapshot?.id;
    if (!bomVersionId) return;

    const order = await createOrder(tokenValue, {
      projectId,
      bomVersionId,
      type: "PO",
      shipping,
    });

    if (order?.id) {
      redirect(`/orders/${order.id}`);
    }
    redirect("/orders");
  }

  if (!project) {
    return (
      <main style={{ minHeight: "80vh" }}>
        <Stack spacing="4">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
            <Text fontSize="lg" fontWeight="700">
              Checkout unavailable
            </Text>
            <Text color="var(--muted)">{error || "Project not found."}</Text>
            <Button as={Link} href="/projects" mt="3" variant="outline" borderColor="var(--border)" color="var(--text)">
              Back to projects
            </Button>
          </Box>
        </Stack>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="2">
            <HStack justify="space-between" align={{ base: "flex-start", md: "center" }} flexWrap="wrap">
              <Stack spacing="1">
                <Text fontSize="lg" fontWeight="700">
                  Checkout for {project.name}
                </Text>
                <Text color="var(--muted)" fontSize="sm">
                  Confirm where this PO should ship.
                </Text>
              </Stack>
              <Button as={Link} href={`/projects/${projectId}`} variant="outline" borderColor="var(--border)" color="var(--text)">
                Back to project
              </Button>
            </HStack>
            {error && <Text color="#f59e0b">{error}</Text>}
          </Stack>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="3">
            <Text fontWeight="700">Order summary</Text>
            <Text color="var(--muted)" fontSize="sm">
              Subtotal: {formatCurrency(toNumber(totals?.subtotal ?? 0), currency)}
            </Text>
            <Text color="var(--muted)" fontSize="sm">
              Shipping: {formatCurrency(shippingCost, currency)}
            </Text>
            <Text color="var(--muted)" fontSize="sm">
              Tax: {formatCurrency(taxCost, currency)}
            </Text>
            <Divider borderColor="var(--border)" />
            <Text fontWeight="700">
              Total: {formatCurrency(totalCost, currency)}
            </Text>
          </Stack>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <form action={checkoutAction}>
            <Stack spacing="4">
              <Stack spacing="1">
                <Text fontWeight="700">Shipping address</Text>
                <Text color="var(--muted)" fontSize="sm">
                  Defaults to your organization business address. Edit to override for this PO.
                </Text>
              </Stack>

              <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap="3">
                <FormControl>
                  <FormLabel color="var(--muted)">Address line 1</FormLabel>
                  <Input
                    name="address1"
                    defaultValue={businessAddress.address1 || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">Address line 2</FormLabel>
                  <Input
                    name="address2"
                    defaultValue={businessAddress.address2 || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
              </Grid>

              <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap="3">
                <FormControl>
                  <FormLabel color="var(--muted)">City</FormLabel>
                  <Input
                    name="city"
                    defaultValue={businessAddress.city || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">State/Region</FormLabel>
                  <Input
                    name="state"
                    defaultValue={businessAddress.state || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">Postal code</FormLabel>
                  <Input
                    name="postalCode"
                    defaultValue={businessAddress.postalCode || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">Country</FormLabel>
                  <Input
                    name="country"
                    defaultValue={businessAddress.country || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
              </Grid>

              <Button type="submit" bg="var(--primary)" color="#fff" _hover={{ bg: "#1f5ee0" }}>
                Place PO
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </main>
  );
}
