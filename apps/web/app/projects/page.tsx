import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Box, Button, Grid, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { createProject, fetchProjects } from "../../lib/projects";

async function getToken() {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  return token;
}

export default async function ProjectsPage({ searchParams }: { searchParams?: { limit?: string; offset?: string } }) {
  const token = await getToken();
  if (!token) {
    redirect("/auth/login");
  }

  const limit = searchParams?.limit ? Number(searchParams.limit) : 10;
  const offset = searchParams?.offset ? Number(searchParams.offset) : 0;

  let data: { items: any[]; total: number; limit: number; offset: number } | null = null;
  let error: string | null = null;
  try {
    data = await fetchProjects(token!, { limit, offset });
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load projects";
  }

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack direction="row" justify="space-between" align="center" mb="3">
            <Box>
              <Text fontSize="lg" fontWeight="700">
                Projects
              </Text>
              <Text color="var(--muted)">Create and list org projects</Text>
            </Box>
            <Text color="var(--accent)" fontWeight="600">
              {data ? `${data.total} projects` : ""}
            </Text>
          </Stack>
          <ProjectForm token={token!} />
          {error && <Text color="#f59e0b">{error}</Text>}
          <Grid templateColumns="repeat(auto-fit, minmax(260px, 1fr))" gap="3" mt="3">
            {data?.items?.map((p) => (
              <Box key={p.id} bg="var(--card)" border="1px solid var(--border)" borderRadius="12px" p="4">
                <Stack spacing="1">
                  <Text fontWeight="700">{p.name}</Text>
                  <Text color="var(--muted)" fontSize="sm">
                    Status: {p.status}
                  </Text>
                  <Text color="var(--accent)" fontSize="sm">
                    #{p.id}
                  </Text>
                </Stack>
              </Box>
            ))}
            {!data && !error && <Text color="var(--muted)">Loading projects…</Text>}
            {data && data.items.length === 0 && <Text color="var(--muted)">No projects yet.</Text>}
          </Grid>
        </Box>
      </Stack>
    </main>
  );
}

function ProjectForm({ token }: { token: string }) {
  async function action(formData: FormData) {
    "use server";
    const name = formData.get("name")?.toString() || "";
    if (!name) return;
    await createProject(token, { name });
    redirect("/projects");
  }

  return (
    <form action={action}>
      <HStack spacing="2">
        <Input name="name" placeholder="Project name" bg="var(--card)" borderColor="var(--border)" />
        <Button type="submit" bg="var(--primary)" color="#fff">
          Create
        </Button>
      </HStack>
    </form>
  );
}
