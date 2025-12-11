import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Stack, Text, Grid, Badge, Button } from "@chakra-ui/react";
import { fetchProjects } from "../../../lib/projects";
import { fetchProjectDetail } from "../../../lib/projects";

async function getToken() {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  return token;
}

export default async function ProjectDetail({ params }: { params: { id: string } }) {
  const token = await getToken();
  if (!token) redirect("/auth/login");

  let project: any = null;
  let error: string | null = null;
  try {
    project = await fetchProjectDetail(token, Number(params.id));
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load project";
  }

  if (!project) {
    return (
      <main style={{ minHeight: "60vh" }}>
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5">
          <Text fontWeight="700">Project</Text>
          <Text color="#f59e0b">{error}</Text>
        </Box>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5">
          <Text fontSize="lg" fontWeight="700">
            {project.name}
          </Text>
          <Text color="var(--muted)">Status: {project.status}</Text>
          <Text color="var(--accent)" fontWeight="600">
            #{project.id}
          </Text>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5">
          <Text fontWeight="700" mb="2">
            Line items
          </Text>
          <Grid templateColumns="repeat(auto-fit, minmax(260px, 1fr))" gap="3">
            {project.lineItems?.map((li: any) => (
              <Box key={li.id} bg="var(--card)" border="1px solid var(--border)" borderRadius="12px" p="3">
                <Stack spacing="1">
                  <Text fontWeight="700">{li.product?.name || "Product"}</Text>
                  <Text color="var(--muted)" fontSize="sm">
                    Qty: {li.qty}
                  </Text>
                  {li.room && (
                    <Badge colorScheme="blue" variant="outline" width="fit-content">
                      Room: {li.room.name}
                    </Badge>
                  )}
                </Stack>
              </Box>
            ))}
            {(!project.lineItems || project.lineItems.length === 0) && (
              <Text color="var(--muted)">No line items yet.</Text>
            )}
          </Grid>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5">
          <Stack direction="row" justify="space-between" align="center">
            <Text fontWeight="700">BOM versions</Text>
            <Button as="a" href={`/projects/${project.id}/bom`} variant="outline" color="var(--text)" borderColor="var(--border)">
              Snapshots
            </Button>
          </Stack>
          {project.bomVersions?.length ? (
            <Stack spacing="2" mt="2">
              {project.bomVersions.map((v: any) => (
                <Box key={v.id} bg="var(--card)" border="1px solid var(--border)" borderRadius="10px" p="3">
                  <Text fontWeight="700">Version {v.id}</Text>
                  <Text color="var(--muted)" fontSize="sm">
                    {v.createdAt}
                  </Text>
                </Box>
              ))}
            </Stack>
          ) : (
            <Text color="var(--muted)" mt="2">
              No BOM snapshots yet.
            </Text>
          )}
        </Box>
      </Stack>
    </main>
  );
}
