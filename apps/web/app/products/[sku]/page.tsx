import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Badge, Box, Button, Grid, HStack, Stack, Text, Textarea, Select, Input } from "@chakra-ui/react";
import { fetchProduct, fetchProductFamilies } from "../../../lib/products";
import { addLineItem, fetchProjects } from "../../../lib/projects";
import { fetchProfile } from "../../../lib/auth";

async function getToken() {
  return cookies().get("token")?.value || null;
}

export default async function ProductPage({ params }: { params: { sku: string } }) {
  const token = await getToken();
  const product = await fetchProduct(params.sku);
  const brand = product.facets?.find((f) => f.key === "brand")?.value;

  let familyGroup: { family: any; variants: any[] } | null = null;
  try {
    const familyRes = await fetchProductFamilies({ q: product.name, brand: brand });
    familyGroup = familyRes.items.find((g) => g.variants.some((v: any) => v.sku === product.sku)) || null;
  } catch {
    familyGroup = null;
  }

  let projects: Awaited<ReturnType<typeof fetchProjects>> | null = null;
  let user: any = null;
  if (token) {
    try {
      projects = await fetchProjects(token, { limit: 20, offset: 0 });
    } catch {
      projects = null;
    }
    try {
      user = await fetchProfile(token);
    } catch {
      user = null;
    }
  }

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack direction="row" justify="space-between" align="start">
            <Box>
              <Text fontSize="lg" fontWeight="700" m="0">
                {product.name}
              </Text>
              <Text color="var(--muted)" m="0 0 6px">
                {product.sku}
              </Text>
              {brand && (
                <Text color="var(--muted)" m="0 0 6px">
                  Brand: {brand}
                </Text>
              )}
              <HStack spacing="2" flexWrap="wrap">
                {product.category && (
                  <Badge colorScheme="purple" variant="outline">
                    {product.category}
                  </Badge>
                )}
                {product.facets?.map((f, idx) => (
                  <Badge key={`${f.key}-${idx}`} colorScheme="blue" variant="subtle">
                    {f.key}: {f.value}
                  </Badge>
                ))}
              </HStack>
            </Box>
            <Stack align="flex-end" spacing="2">
              <Text color="var(--accent)" fontWeight="700" fontSize="xl">
                {product.currency || ""} {product.msrp || product.unitCost || ""}
              </Text>
              <Text color="var(--muted)" fontSize="sm">
                Lead time: {product.leadTimeDays ?? "n/a"} days
              </Text>
              <Text color="var(--muted)" fontSize="sm">
                Stock: {product.stockBand || "n/a"}
              </Text>
            </Stack>
          </Stack>
          <Text mt="3" color="var(--text)">
            {product.description || "No description"}
          </Text>
        </Box>

        <Grid templateColumns="repeat(auto-fit, minmax(260px, 1fr))" gap="3">
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
            <Text fontWeight="700" mb="3">
              Add to project
            </Text>
            {token ? (
              projects && projects.items.length ? (
                <AddToProjectForm productId={product.id!} projects={projects.items} />
              ) : (
                <Text color="var(--muted)">No projects found. Create one first.</Text>
              )
            ) : (
              <Box>
                <Text color="var(--muted)" mb="2">
                  Login to add this product to a project.
                </Text>
                <Button as="a" href="/auth/login" bg="var(--primary)" color="#fff">
                  Login
                </Button>
              </Box>
            )}
          </Box>
          {familyGroup && (
            <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
              <Text fontWeight="700" mb="2">
                Variants in this family
              </Text>
              <Stack spacing="2">
                {familyGroup.variants.map((v) => (
                  <HStack key={v.sku} justify="space-between" align="center">
                    <Stack spacing="0">
                      <Text fontWeight="700">{v.name}</Text>
                      <Text color="var(--muted)" fontSize="sm">
                        {v.sku}
                      </Text>
                    </Stack>
                    {v.sku === product.sku ? (
                      <Badge colorScheme="blue">Current</Badge>
                    ) : (
                      <Button as="a" href={`/products/${encodeURIComponent(v.sku)}`} size="sm" variant="outline" borderColor="var(--border)">
                        View
                      </Button>
                    )}
                  </HStack>
                ))}
              </Stack>
            </Box>
          )}
          {user?.role === "OWNER" && (
            <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
              <Text fontWeight="700" mb="2">
                Supplier & pricing
              </Text>
              <Stack spacing="1" color="var(--muted)" fontSize="sm">
                <Text>Supplier: {product.supplier?.name || "n/a"}</Text>
                <Text>Unit cost: {product.pricing?.baseUnitCostNGN || product.unitCost || "n/a"}</Text>
                <Text>MSRP: {product.pricing?.msrpNGN || product.msrp || "n/a"}</Text>
              </Stack>
            </Box>
          )}
        </Grid>
      </Stack>
    </main>
  );
}

function AddToProjectForm({ productId, projects }: { productId: number; projects: Array<{ id: number; name: string }> }) {
  async function action(formData: FormData) {
    "use server";
    const projectId = Number(formData.get("projectId"));
    const qty = Number(formData.get("qty") || "1");
    const notes = formData.get("notes")?.toString().trim();
    if (!projectId || qty < 1) return;

    const token = cookies().get("token")?.value;
    if (!token) {
      redirect("/auth/login");
    }

    await addLineItem(token, projectId, { productId, qty, notes: notes || undefined });
    redirect(`/projects/${projectId}`);
  }

  return (
    <form action={action}>
      <Stack spacing="3">
        <Select name="projectId" bg="var(--card)" borderColor="var(--border)">
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              #{p.id} {p.name}
            </option>
          ))}
        </Select>
        <Input name="qty" type="number" min="1" defaultValue="1" bg="var(--card)" borderColor="var(--border)" />
        <Textarea name="notes" placeholder="Notes (optional)" bg="var(--card)" borderColor="var(--border)" />
        <Button type="submit" bg="var(--primary)" color="#fff">
          Add to project
        </Button>
      </Stack>
    </form>
  );
}
