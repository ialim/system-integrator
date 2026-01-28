import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Badge, Box, Button, FormControl, FormLabel, Input, Link, Stack, Text } from "@chakra-ui/react";
import { fetchProfile } from "../../../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default async function SecuritySettingsPage({ searchParams }: { searchParams?: { setup?: string; success?: string; error?: string } }) {
  const token = cookies().get("token")?.value;
  if (!token) redirect("/auth/login");

  let user: Awaited<ReturnType<typeof fetchProfile>> | null = null;
  try {
    user = await fetchProfile(token);
  } catch {
    redirect("/auth/login");
  }

  const setupSecret = cookies().get("mfa_setup_secret")?.value || "";
  const setupUri = cookies().get("mfa_setup_uri")?.value || "";

  async function startSetup() {
    "use server";
    const tokenValue = cookies().get("token")?.value;
    if (!tokenValue) redirect("/auth/login");
    const res = await fetch(`${API_URL}/auth/mfa/setup`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenValue}` }
    });
    if (!res.ok) {
      redirect(`/settings/security?error=${encodeURIComponent("Unable to start MFA setup")}`);
    }
    const data = await res.json();
    cookies().set("mfa_setup_secret", data.secret, { httpOnly: true, path: "/", maxAge: 10 * 60 });
    cookies().set("mfa_setup_uri", data.otpauth_url, { httpOnly: true, path: "/", maxAge: 10 * 60 });
    redirect("/settings/security?setup=1");
  }

  async function confirmSetup(formData: FormData) {
    "use server";
    const code = formData.get("code")?.toString() || "";
    const tokenValue = cookies().get("token")?.value;
    if (!tokenValue) redirect("/auth/login");
    const res = await fetch(`${API_URL}/auth/mfa/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenValue}` },
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      let msg = "Unable to confirm MFA";
      try {
        const body = await res.json();
        msg = body?.message || msg;
      } catch {
        // ignore parse error
      }
      redirect(`/settings/security?error=${encodeURIComponent(msg)}`);
    }
    cookies().delete("mfa_setup_secret");
    cookies().delete("mfa_setup_uri");
    redirect("/settings/security?success=1");
  }

  async function disableMfa(formData: FormData) {
    "use server";
    const code = formData.get("code")?.toString() || "";
    const tokenValue = cookies().get("token")?.value;
    if (!tokenValue) redirect("/auth/login");
    const res = await fetch(`${API_URL}/auth/mfa/disable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenValue}` },
      body: JSON.stringify({ code })
    });
    if (!res.ok) {
      let msg = "Unable to disable MFA";
      try {
        const body = await res.json();
        msg = body?.message || msg;
      } catch {
        // ignore parse error
      }
      redirect(`/settings/security?error=${encodeURIComponent(msg)}`);
    }
    cookies().delete("mfa_setup_secret");
    cookies().delete("mfa_setup_uri");
    redirect("/settings/security?success=1");
  }

  const mfaEnabled = Boolean((user as any)?.mfaEnabled);

  return (
    <main style={{ minHeight: "80vh" }}>
      <Stack spacing="4">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="1">
            <Text fontSize="lg" fontWeight="700">
              Security settings
            </Text>
            <Text color="var(--muted)">Manage two-factor authentication for your account.</Text>
          </Stack>
        </Box>

        {(searchParams?.success || searchParams?.error) && (
          <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="4">
            {searchParams?.success && (
              <Text color="var(--accent)">Security settings updated.</Text>
            )}
            {searchParams?.error && (
              <Text color="#f59e0b">{searchParams.error}</Text>
            )}
          </Box>
        )}

        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="16px" p="5">
          <Stack spacing="3">
            <Stack spacing="1">
              <Text fontWeight="700">Two-factor authentication</Text>
              <Text color="var(--muted)">Use an authenticator app to protect your account.</Text>
              <Badge alignSelf="flex-start" bg="rgba(255,255,255,0.08)" color={mfaEnabled ? "var(--accent)" : "var(--muted)"} borderRadius="8px" px="2" py="1">
                {mfaEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </Stack>

            {!mfaEnabled && (
              <Stack spacing="3">
                <form action={startSetup}>
                  <Button type="submit" bg="var(--primary)" color="#fff" fontWeight="700">
                    Start setup
                  </Button>
                </form>

                {setupSecret && (
                  <Box bg="var(--card)" border="1px solid var(--border)" borderRadius="12px" p="4">
                    <Stack spacing="2">
                      <Text fontWeight="600">Scan or enter this secret</Text>
                      <Text color="var(--muted)" fontSize="sm">
                        Secret: {setupSecret}
                      </Text>
                      {setupUri && (
                        <Link href={setupUri} color="var(--accent)" fontSize="sm">
                          Open authenticator link
                        </Link>
                      )}
                    </Stack>
                  </Box>
                )}

                {setupSecret && (
                  <form action={confirmSetup}>
                    <Stack spacing="3">
                      <FormControl>
                        <FormLabel color="var(--muted)">Verification code</FormLabel>
                        <Input name="code" type="text" inputMode="numeric" bg="var(--card)" borderColor="var(--border)" required />
                      </FormControl>
                      <Button type="submit" variant="outline" borderColor="var(--border)" color="var(--text)" fontWeight="700">
                        Confirm and enable
                      </Button>
                    </Stack>
                  </form>
                )}
              </Stack>
            )}

            {mfaEnabled && (
              <form action={disableMfa}>
                <Stack spacing="3">
                  <FormControl>
                    <FormLabel color="var(--muted)">Verification code</FormLabel>
                    <Input name="code" type="text" inputMode="numeric" bg="var(--card)" borderColor="var(--border)" required />
                  </FormControl>
                  <Button type="submit" variant="outline" borderColor="var(--border)" color="var(--text)" fontWeight="700">
                    Disable MFA
                  </Button>
                </Stack>
              </form>
            )}
          </Stack>
        </Box>
      </Stack>
    </main>
  );
}
