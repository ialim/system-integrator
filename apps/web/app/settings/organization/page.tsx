import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Button, FormControl, FormLabel, Grid, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { fetchOrgProfile, updateOrgProfile } from "../../../lib/org";

const toNumber = (value: FormDataEntryValue | null) => {
  const text = value?.toString().trim() || "";
  if (!text) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const toText = (value: FormDataEntryValue | null) => {
  const text = value?.toString().trim() || "";
  return text.length ? text : null;
};

export default async function OrganizationSettingsPage({
  searchParams
}: {
  searchParams?: { success?: string; error?: string };
}) {
  const token = cookies().get("token")?.value;
  if (!token) redirect("/auth/login");

  let org: Awaited<ReturnType<typeof fetchOrgProfile>> | null = null;
  let error: string | null = null;

  try {
    org = await fetchOrgProfile(token);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load organization profile";
  }

  const address =
    org?.businessAddress && typeof org.businessAddress === "object"
      ? (org.businessAddress as Record<string, any>)
      : {};
  const proposalDefaults =
    org?.proposalDefaults && typeof org.proposalDefaults === "object"
      ? (org.proposalDefaults as Record<string, any>)
      : null;
  const markupRaw = proposalDefaults?.markupPercent;
  const markupPercent =
    markupRaw === null || markupRaw === undefined || markupRaw === ""
      ? null
      : Number(markupRaw);
  const logoUrl = proposalDefaults?.logoUrl || "";
  const brandColor = proposalDefaults?.brandColor || "";
  const contactEmail = proposalDefaults?.contactEmail || "";
  const contactPhone = proposalDefaults?.contactPhone || "";
  const website = proposalDefaults?.website || "";
  const introNote = proposalDefaults?.introNote || "";
  const terms = proposalDefaults?.terms || "";

  async function updateProfileAction(formData: FormData) {
    "use server";
    const tokenValue = cookies().get("token")?.value;
    if (!tokenValue) redirect("/auth/login");

    const name = formData.get("name")?.toString().trim() || "";
    const addressValue = {
      address1: toText(formData.get("address1")),
      address2: toText(formData.get("address2")),
      city: toText(formData.get("city")),
      state: toText(formData.get("state")),
      postalCode: toText(formData.get("postalCode")),
      country: toText(formData.get("country"))
    };
    const hasAddress = Object.values(addressValue).some((value) => value);

    const markupRaw = toNumber(formData.get("markupPercent"));
    const proposalDefaults: Record<string, any> = {
      markupPercent: markupRaw === null ? null : Math.min(Math.max(markupRaw, 0), 100),
      logoUrl: toText(formData.get("logoUrl")) || null,
      brandColor: toText(formData.get("brandColor")) || null,
      contactEmail: toText(formData.get("contactEmail")) || null,
      contactPhone: toText(formData.get("contactPhone")) || null,
      website: toText(formData.get("website")) || null,
      introNote: toText(formData.get("introNote")) || null,
      terms: toText(formData.get("terms")) || null
    };
    const hasDefaults = Object.values(proposalDefaults).some((value) => value !== null && value !== "");

    await updateOrgProfile(tokenValue, {
      name: name || undefined,
      businessAddress: hasAddress ? addressValue : null,
      proposalDefaults: hasDefaults ? proposalDefaults : null
    });
    redirect("/settings/organization?success=1");
  }

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="1">
            <Text fontSize="lg" fontWeight="700">
              Organization profile
            </Text>
            <Text color="var(--muted)">
              Update your business address and proposal defaults.
            </Text>
          </Stack>
        </Box>

        {(searchParams?.success || searchParams?.error || error) && (
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="4">
            {searchParams?.success && <Text color="var(--accent)">Profile updated.</Text>}
            {(searchParams?.error || error) && (
              <Text color="#f59e0b">{searchParams?.error || error}</Text>
            )}
          </Box>
        )}

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <form action={updateProfileAction}>
            <Stack spacing="4">
              <Stack spacing="1">
                <Text fontWeight="700">Business details</Text>
                <Text color="var(--muted)" fontSize="sm">
                  This address is used as the default shipping destination for POs.
                </Text>
              </Stack>

              <FormControl>
                <FormLabel color="var(--muted)">Organization name</FormLabel>
                <Input
                  name="name"
                  defaultValue={org?.name || ""}
                  bg="var(--card)"
                  borderColor="var(--border)"
                />
              </FormControl>

              <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap="3">
                <FormControl>
                  <FormLabel color="var(--muted)">Address line 1</FormLabel>
                  <Input
                    name="address1"
                    defaultValue={address.address1 || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">Address line 2</FormLabel>
                  <Input
                    name="address2"
                    defaultValue={address.address2 || ""}
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
                    defaultValue={address.city || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">State/Region</FormLabel>
                  <Input
                    name="state"
                    defaultValue={address.state || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">Postal code</FormLabel>
                  <Input
                    name="postalCode"
                    defaultValue={address.postalCode || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">Country</FormLabel>
                  <Input
                    name="country"
                    defaultValue={address.country || ""}
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
              </Grid>

              <Stack spacing="1">
                <Text fontWeight="700">Proposal defaults</Text>
                <Text color="var(--muted)" fontSize="sm">
                  Markup applies only to shared proposals, not POs.
                </Text>
              </Stack>

              <FormControl maxW={{ base: "100%", md: "260px" }}>
                <FormLabel color="var(--muted)">Default markup (%)</FormLabel>
                <Input
                  name="markupPercent"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  defaultValue={Number.isFinite(markupPercent ?? NaN) ? markupPercent ?? undefined : ""}
                  bg="var(--card)"
                  borderColor="var(--border)"
                />
              </FormControl>

              <Stack spacing="1">
                <Text fontWeight="700">Proposal branding</Text>
                <Text color="var(--muted)" fontSize="sm">
                  These details appear on shared proposals.
                </Text>
              </Stack>

              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3">
                <FormControl>
                  <FormLabel color="var(--muted)">Logo URL</FormLabel>
                  <Input
                    name="logoUrl"
                    defaultValue={logoUrl}
                    placeholder="https://"
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">Brand color</FormLabel>
                  <Input
                    name="brandColor"
                    defaultValue={brandColor}
                    placeholder="#2d6bff"
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
              </Grid>

              <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="3">
                <FormControl>
                  <FormLabel color="var(--muted)">Contact email</FormLabel>
                  <Input
                    name="contactEmail"
                    defaultValue={contactEmail}
                    placeholder="sales@company.com"
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">Contact phone</FormLabel>
                  <Input
                    name="contactPhone"
                    defaultValue={contactPhone}
                    placeholder="+1 555 0100"
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel color="var(--muted)">Website</FormLabel>
                  <Input
                    name="website"
                    defaultValue={website}
                    placeholder="www.company.com"
                    bg="var(--card)"
                    borderColor="var(--border)"
                  />
                </FormControl>
              </Grid>

              <FormControl>
                <FormLabel color="var(--muted)">Intro note</FormLabel>
                <Textarea
                  name="introNote"
                  defaultValue={introNote}
                  placeholder="Short intro for the proposal cover."
                  bg="var(--card)"
                  borderColor="var(--border)"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="var(--muted)">Terms</FormLabel>
                <Textarea
                  name="terms"
                  defaultValue={terms}
                  placeholder="Payment terms, validity, delivery notes."
                  bg="var(--card)"
                  borderColor="var(--border)"
                />
              </FormControl>

              <Button type="submit" bg="var(--primary)" color="#fff" alignSelf="flex-start">
                Save profile
              </Button>
            </Stack>
          </form>
        </Box>
      </Stack>
    </main>
  );
}
