import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Button, FormControl, FormLabel, Grid, HStack, Input, Stack, Text, Textarea, Link } from "@chakra-ui/react";
import { deleteClient, fetchClient, updateClient } from "../../../lib/clients";
import { ConfirmActionButton } from "../../../components/ConfirmActionButton";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const token = cookies().get("token")?.value;
  if (!token) redirect("/auth/login");

  const clientId = Number(params.id);
  let client: Awaited<ReturnType<typeof fetchClient>> | null = null;
  let error: string | null = null;

  try {
    client = await fetchClient(token, clientId);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load client";
  }

  const address = client?.address && typeof client.address === "object" ? (client.address as Record<string, any>) : {};

  async function updateAction(formData: FormData) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");

    const toText = (value: FormDataEntryValue | null) => {
      const text = value?.toString().trim() || "";
      return text.length ? text : null;
    };

    const name = toText(formData.get("name"));
    if (!name) return;

    const nextAddress = {
      address1: toText(formData.get("address1")),
      address2: toText(formData.get("address2")),
      city: toText(formData.get("city")),
      state: toText(formData.get("state")),
      postalCode: toText(formData.get("postalCode")),
      country: toText(formData.get("country"))
    };
    const hasAddress = Object.values(nextAddress).some((value) => value);

    await updateClient(token, clientId, {
      name,
      email: toText(formData.get("email")),
      phone: toText(formData.get("phone")),
      notes: toText(formData.get("notes")),
      address: hasAddress ? nextAddress : null
    });
    redirect(`/clients/${clientId}`);
  }

  async function deleteAction(_: FormData) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    await deleteClient(token, clientId);
    redirect("/clients");
  }

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="1">
            <Text fontSize="lg" fontWeight="700">
              Client details
            </Text>
            <HStack spacing="3">
              <Button as={Link} href="/clients" variant="outline" borderColor="var(--border)" color="var(--text)">
                Back to clients
              </Button>
              {client && (
                <ConfirmActionButton
                  action={deleteAction}
                  confirmMessage="Delete this client? This cannot be undone."
                  size="sm"
                  variant="outline"
                  colorScheme="red"
                >
                  Delete client
                </ConfirmActionButton>
              )}
            </HStack>
            {error && <Text color="#f59e0b">{error}</Text>}
          </Stack>
        </Box>

        {client && (
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
            <form action={updateAction}>
              <Stack spacing="3">
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="3">
                  <FormControl>
                    <FormLabel color="var(--muted)">Client name</FormLabel>
                    <Input name="name" defaultValue={client.name} bg="var(--card)" borderColor="var(--border)" />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="var(--muted)">Email</FormLabel>
                    <Input name="email" type="email" defaultValue={client.email || ""} bg="var(--card)" borderColor="var(--border)" />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="var(--muted)">Phone</FormLabel>
                    <Input name="phone" defaultValue={client.phone || ""} bg="var(--card)" borderColor="var(--border)" />
                  </FormControl>
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap="3">
                  <FormControl>
                    <FormLabel color="var(--muted)">Address line 1</FormLabel>
                    <Input name="address1" defaultValue={address.address1 || ""} bg="var(--card)" borderColor="var(--border)" />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="var(--muted)">Address line 2</FormLabel>
                    <Input name="address2" defaultValue={address.address2 || ""} bg="var(--card)" borderColor="var(--border)" />
                  </FormControl>
                </Grid>

                <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap="3">
                  <FormControl>
                    <FormLabel color="var(--muted)">City</FormLabel>
                    <Input name="city" defaultValue={address.city || ""} bg="var(--card)" borderColor="var(--border)" />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="var(--muted)">State/Region</FormLabel>
                    <Input name="state" defaultValue={address.state || ""} bg="var(--card)" borderColor="var(--border)" />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="var(--muted)">Postal code</FormLabel>
                    <Input name="postalCode" defaultValue={address.postalCode || ""} bg="var(--card)" borderColor="var(--border)" />
                  </FormControl>
                  <FormControl>
                    <FormLabel color="var(--muted)">Country</FormLabel>
                    <Input name="country" defaultValue={address.country || ""} bg="var(--card)" borderColor="var(--border)" />
                  </FormControl>
                </Grid>

                <FormControl>
                  <FormLabel color="var(--muted)">Notes</FormLabel>
                  <Textarea name="notes" defaultValue={client.notes || ""} bg="var(--card)" borderColor="var(--border)" />
                </FormControl>

                <Button type="submit" bg="var(--primary)" color="#fff" alignSelf="flex-start">
                  Save changes
                </Button>
              </Stack>
            </form>
          </Box>
        )}
      </Stack>
    </main>
  );
}
