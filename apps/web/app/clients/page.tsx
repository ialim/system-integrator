import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Box, Button, Grid, HStack, Input, Stack, Text, Link, FormControl, FormLabel, Textarea } from "@chakra-ui/react";
import { createClient, fetchClient, fetchClients } from "../../lib/clients";
import { fetchProjectDetail, updateProject } from "../../lib/projects";

async function getToken() {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  return token;
}

export default async function ClientsPage({
  searchParams
}: {
  searchParams?: { limit?: string; offset?: string; selectProjectId?: string };
}) {
  const token = await getToken();
  if (!token) {
    return (
      <main style={{ minHeight: "80vh" }}>
        <Stack spacing="4">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
            <Stack spacing="3">
              <Text fontSize="lg" fontWeight="700">
                Clients
              </Text>
              <Text color="var(--muted)">Sign in to manage client contacts.</Text>
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
  const selectProjectId = searchParams?.selectProjectId ? Number(searchParams.selectProjectId) : null;
  const selectionMode = Number.isFinite(selectProjectId);

  let data: { items: any[]; total: number; limit: number; offset: number } | null = null;
  let error: string | null = null;
  try {
    data = await fetchClients(token, { limit, offset });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load clients";
  }

  async function selectClientAction(clientId: number) {
    "use server";
    const token = cookies().get("token")?.value;
    if (!token) redirect("/auth/login");
    if (!selectionMode || !selectProjectId) return;

    const [client, project] = await Promise.all([
      fetchClient(token, clientId),
      fetchProjectDetail(token, selectProjectId)
    ]);

    const existingMeta =
      project?.clientMeta && typeof project.clientMeta === "object" ? (project.clientMeta as Record<string, any>) : {};
    const address = client?.address && typeof client.address === "object" ? (client.address as Record<string, any>) : {};
    const nextMeta = {
      ...existingMeta,
      clientId: client.id,
      client: {
        name: client.name,
        email: client.email || null,
        phone: client.phone || null
      },
      shipping: {
        ...(existingMeta.shipping || {}),
        address1: address.address1 || null,
        address2: address.address2 || null,
        city: address.city || null,
        state: address.state || null,
        postalCode: address.postalCode || null,
        country: address.country || null
      }
    };

    await updateProject(token, selectProjectId, { clientMeta: nextMeta });
    redirect(`/projects/${selectProjectId}`);
  }

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack direction="row" justify="space-between" align="center" mb="3">
            <Box>
              <Text fontSize="lg" fontWeight="700">
                Clients
              </Text>
              <Text color="var(--muted)">Manage client contacts and addresses.</Text>
            </Box>
            <Text color="var(--accent)" fontWeight="600">
              {data ? `${data.total} clients` : ""}
            </Text>
          </Stack>

          {selectionMode && selectProjectId ? (
            <Box border="1px solid var(--border)" borderRadius="12px" p="3" bg="rgba(255,255,255,0.04)" mb="3">
              <Stack spacing="1">
                <Text fontWeight="600">Select a client for project #{selectProjectId}</Text>
                <Button
                  as={Link}
                  href={`/projects/${selectProjectId}`}
                  variant="outline"
                  borderColor="var(--border)"
                  color="var(--text)"
                  size="sm"
                  alignSelf="flex-start"
                >
                  Back to project
                </Button>
              </Stack>
            </Box>
          ) : null}

          <ClientForm token={token} selectProjectId={selectionMode ? selectProjectId : null} />
          {error && <Text color="#f59e0b">{error}</Text>}

          <Grid templateColumns="repeat(auto-fit, minmax(260px, 1fr))" gap="3" mt="3">
            {data?.items?.map((client) => {
              const address = client.address || {};
              const location = [address.city, address.state, address.country].filter(Boolean).join(", ");
              const cardProps = selectionMode
                ? {}
                : {
                    as: Link,
                    href: `/clients/${client.id}`
                  };
              return (
                <Box
                  key={client.id}
                  bg="var(--card)"
                  border="1px solid var(--border)"
                  borderRadius="12px"
                  p="4"
                  _hover={{ borderColor: "var(--accent)" }}
                  {...cardProps}
                >
                  <Stack spacing="1">
                    <Text fontWeight="700">{client.name}</Text>
                    {client.email && (
                      <Text color="var(--muted)" fontSize="sm">
                        {client.email}
                      </Text>
                    )}
                    {client.phone && (
                      <Text color="var(--muted)" fontSize="sm">
                        {client.phone}
                      </Text>
                    )}
                    {location && (
                      <Text color="var(--muted)" fontSize="sm">
                        {location}
                      </Text>
                    )}
                    {selectionMode ? (
                      <HStack spacing="2" mt="2" flexWrap="wrap">
                        <form action={selectClientAction.bind(null, client.id)}>
                          <Button size="sm" bg="var(--primary)" color="#fff" type="submit">
                            Select for project
                          </Button>
                        </form>
                        <Button
                          as={Link}
                          href={`/clients/${client.id}`}
                          size="sm"
                          variant="outline"
                          borderColor="var(--border)"
                          color="var(--text)"
                        >
                          View details
                        </Button>
                      </HStack>
                    ) : null}
                  </Stack>
                </Box>
              );
            })}
            {!data && !error && <Text color="var(--muted)">Loading clients...</Text>}
            {data && data.items.length === 0 && <Text color="var(--muted)">No clients yet.</Text>}
          </Grid>
          {data && (
            <Pagination
              total={data.total}
              limit={limit}
              offset={offset}
              selectProjectId={selectionMode ? selectProjectId : null}
            />
          )}
        </Box>
      </Stack>
    </main>
  );
}

function ClientForm({ token, selectProjectId }: { token: string; selectProjectId?: number | null }) {
  async function action(formData: FormData) {
    "use server";
    const name = formData.get("name")?.toString().trim() || "";
    if (!name) return;

    const toText = (value: FormDataEntryValue | null) => {
      const text = value?.toString().trim() || "";
      return text.length ? text : null;
    };

    const address = {
      address1: toText(formData.get("address1")),
      address2: toText(formData.get("address2")),
      city: toText(formData.get("city")),
      state: toText(formData.get("state")),
      postalCode: toText(formData.get("postalCode")),
      country: toText(formData.get("country"))
    };

    const hasAddress = Object.values(address).some((value) => value);

    await createClient(token, {
      name,
      email: toText(formData.get("email")),
      phone: toText(formData.get("phone")),
      notes: toText(formData.get("notes")),
      address: hasAddress ? address : null
    });
    const nextHref = selectProjectId ? `/clients?selectProjectId=${selectProjectId}` : "/clients";
    redirect(nextHref);
  }

  return (
    <form action={action}>
      <Stack spacing="3">
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="3">
          <FormControl>
            <FormLabel color="var(--muted)">Client name</FormLabel>
            <Input name="name" placeholder="Client name" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Email</FormLabel>
            <Input name="email" type="email" placeholder="name@company.com" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Phone</FormLabel>
            <Input name="phone" placeholder="+1 555 0110" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
        </Grid>

        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap="3">
          <FormControl>
            <FormLabel color="var(--muted)">Address line 1</FormLabel>
            <Input name="address1" placeholder="Street address" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Address line 2</FormLabel>
            <Input name="address2" placeholder="Suite, floor" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
        </Grid>

        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap="3">
          <FormControl>
            <FormLabel color="var(--muted)">City</FormLabel>
            <Input name="city" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">State/Region</FormLabel>
            <Input name="state" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Postal code</FormLabel>
            <Input name="postalCode" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Country</FormLabel>
            <Input name="country" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
        </Grid>

        <FormControl>
          <FormLabel color="var(--muted)">Notes</FormLabel>
          <Textarea name="notes" bg="var(--card)" borderColor="var(--border)" />
        </FormControl>

        <Button type="submit" bg="var(--primary)" color="#fff" alignSelf="flex-start">
          Add client
        </Button>
      </Stack>
    </form>
  );
}

function Pagination({
  total,
  limit,
  offset,
  selectProjectId
}: {
  total: number;
  limit: number;
  offset: number;
  selectProjectId?: number | null;
}) {
  const nextOffset = offset + limit < total ? offset + limit : null;
  const prevOffset = offset - limit >= 0 ? offset - limit : null;
  const search = (o: number | null) => {
    if (o === null) return undefined;
    const params = new URLSearchParams();
    params.set("offset", String(o));
    params.set("limit", String(limit));
    if (selectProjectId) params.set("selectProjectId", String(selectProjectId));
    return `/clients?${params.toString()}`;
  };
  return (
    <HStack mt="4" spacing="3">
      <Button
        as="a"
        href={prevOffset !== null ? search(prevOffset) : undefined}
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
        href={nextOffset !== null ? search(nextOffset) : undefined}
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
