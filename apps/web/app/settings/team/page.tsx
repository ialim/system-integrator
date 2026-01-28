import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Badge, Box, Button, FormControl, FormLabel, Grid, HStack, Input, Select, Stack, Text } from "@chakra-ui/react";
import { createInvite, fetchOrgInvites, fetchOrgUsers, revokeInvite, updateUserRole } from "../../../lib/org";
import { ConfirmActionButton } from "../../../components/ConfirmActionButton";

const statusLabel = (invite: any) => {
  if (invite.revokedAt) return "Revoked";
  if (invite.acceptedAt) return "Accepted";
  const expires = invite.expiresAt ? new Date(invite.expiresAt).getTime() : 0;
  if (expires && expires < Date.now()) return "Expired";
  return "Pending";
};

export default async function TeamSettingsPage({ searchParams }: { searchParams?: { invite?: string; error?: string } }) {
  const token = cookies().get("token")?.value;
  if (!token) redirect("/auth/login");

  let users: Awaited<ReturnType<typeof fetchOrgUsers>> = [];
  let invites: Awaited<ReturnType<typeof fetchOrgInvites>> = [];
  let error: string | null = null;

  try {
    users = await fetchOrgUsers(token!);
    invites = await fetchOrgInvites(token!);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load team data";
  }

  async function inviteAction(formData: FormData) {
    "use server";
    const email = formData.get("email")?.toString().trim() || "";
    const role = formData.get("role")?.toString() || "ESTIMATOR";
    if (!email) return;
    const tokenValue = cookies().get("token")?.value;
    if (!tokenValue) redirect("/auth/login");
    const invite = await createInvite(tokenValue, { email, role });
    redirect(`/settings/team?invite=${encodeURIComponent(invite.token)}`);
  }

  async function updateRoleAction(userId: number, formData: FormData) {
    "use server";
    const role = formData.get("role")?.toString() || "";
    if (!role) return;
    const tokenValue = cookies().get("token")?.value;
    if (!tokenValue) redirect("/auth/login");
    await updateUserRole(tokenValue, userId, role);
    redirect("/settings/team");
  }

  async function revokeInviteAction(inviteId: number) {
    "use server";
    const tokenValue = cookies().get("token")?.value;
    if (!tokenValue) redirect("/auth/login");
    await revokeInvite(tokenValue, inviteId);
    redirect("/settings/team");
  }

  const inviteLink = searchParams?.invite ? `/auth/invite?token=${encodeURIComponent(searchParams.invite)}` : null;

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="1">
            <Text fontSize="lg" fontWeight="700">
              Team settings
            </Text>
            <Text color="var(--muted)">Invite teammates and manage roles.</Text>
          </Stack>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Text fontWeight="700" mb="3">
            Invite teammate
          </Text>
          {error && (
            <Text color="#f59e0b" mb="2">
              {error}
            </Text>
          )}
          {inviteLink && (
            <Box bg="var(--card)" border="1px solid var(--border)" borderRadius="12px" p="3" mb="3">
              <Text color="var(--muted)" fontSize="sm">
                Invite link
              </Text>
              <Text fontWeight="600">{inviteLink}</Text>
            </Box>
          )}
          <form action={inviteAction}>
            <Grid templateColumns={{ base: "1fr", md: "2fr 1fr auto" }} gap="3" alignItems="end">
              <FormControl>
                <FormLabel color="var(--muted)">Email</FormLabel>
                <Input name="email" type="email" bg="var(--card)" borderColor="var(--border)" required />
              </FormControl>
              <FormControl>
                <FormLabel color="var(--muted)">Role</FormLabel>
                <Select name="role" bg="var(--card)" borderColor="var(--border)" defaultValue="ESTIMATOR">
                  {["OWNER", "ESTIMATOR", "TECH"].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <Button type="submit" bg="var(--primary)" color="#fff" fontWeight="700">
                Send invite
              </Button>
            </Grid>
          </form>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Text fontWeight="700" mb="3">
            Team members
          </Text>
          <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(260px, 1fr))" }} gap="3">
            {users.length ? (
              users.map((user) => (
                <Box key={user.id} border="1px solid var(--border)" borderRadius="12px" p="3" bg="var(--card)">
                  <Stack spacing="2">
                    <Stack spacing="0.5">
                      <Text fontWeight="700">{user.name || user.email}</Text>
                      <Text color="var(--muted)" fontSize="sm">
                        {user.email}
                      </Text>
                      <Text color="var(--muted)" fontSize="xs">
                        {user.emailVerifiedAt ? "Verified" : "Unverified"}
                      </Text>
                    </Stack>
                    <form action={updateRoleAction.bind(null, user.id)}>
                      <HStack spacing="2">
                        <Select name="role" defaultValue={user.role} size="sm" bg="var(--card)" borderColor="var(--border)">
                          {["OWNER", "ESTIMATOR", "TECH"].map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </Select>
                        <Button size="sm" variant="outline" borderColor="var(--border)" color="var(--text)" type="submit">
                          Update
                        </Button>
                      </HStack>
                    </form>
                  </Stack>
                </Box>
              ))
            ) : (
              <Text color="var(--muted)">No team members found.</Text>
            )}
          </Grid>
        </Box>

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Text fontWeight="700" mb="3">
            Pending invites
          </Text>
          <Grid templateColumns={{ base: "1fr", md: "repeat(auto-fit, minmax(260px, 1fr))" }} gap="3">
            {invites.length ? (
              invites.map((invite) => (
                <Box key={invite.id} border="1px solid var(--border)" borderRadius="12px" p="3" bg="var(--card)">
                  <Stack spacing="2">
                    <Stack spacing="0.5">
                      <Text fontWeight="700">{invite.email}</Text>
                      <Text color="var(--muted)" fontSize="sm">
                        Role: {invite.role}
                      </Text>
                      <Badge bg="rgba(255,255,255,0.08)" color="var(--muted)" borderRadius="8px" px="2" py="1">
                        {statusLabel(invite)}
                      </Badge>
                    </Stack>
                    <Text color="var(--muted)" fontSize="xs">
                      Invite link: /auth/invite?token={invite.token}
                    </Text>
                    {!invite.revokedAt && !invite.acceptedAt && (
                      <ConfirmActionButton
                        action={revokeInviteAction.bind(null, invite.id)}
                        confirmMessage="Revoke this invite?"
                        size="sm"
                        variant="outline"
                        borderColor="var(--border)"
                        color="var(--text)"
                      >
                        Revoke
                      </ConfirmActionButton>
                    )}
                  </Stack>
                </Box>
              ))
            ) : (
              <Text color="var(--muted)">No invites yet.</Text>
            )}
          </Grid>
        </Box>
      </Stack>
    </main>
  );
}
