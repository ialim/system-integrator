import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Button, FormControl, FormLabel, Input, Link, Stack, Text } from "@chakra-ui/react";

async function action(formData: FormData) {
  "use server";
  const code = formData.get("code")?.toString() || "";
  if (!code) return;

  const mfaToken = cookies().get("mfa_token")?.value;
  if (!mfaToken) redirect("/auth/login");

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/mfa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: mfaToken, code })
  });

  if (!res.ok) {
    let msg = "Verification failed";
    try {
      const body = await res.json();
      msg = body?.message || msg;
    } catch {
      // ignore parse error
    }
    redirect(`/auth/mfa?error=${encodeURIComponent(msg)}`);
  }

  const data = await res.json();
  cookies().set("token", data.access_token, { httpOnly: true, path: "/" });
  if (data.refresh_token) {
    cookies().set("refresh_token", data.refresh_token, { httpOnly: true, path: "/" });
  }
  cookies().delete("mfa_token");
  redirect("/projects");
}

export default function MfaPage({ searchParams }: { searchParams?: { error?: string } }) {
  const mfaToken = cookies().get("mfa_token")?.value;
  if (!mfaToken) redirect("/auth/login");

  return (
    <Box as="main" display="grid" placeItems="center" minH="80vh">
      <Box as="form" action={action} w="100%" maxW="420px" bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5" gap="3" display="grid">
        <Text as="h1" fontSize="xl" fontWeight="700" m="0 0 2">
          Two-factor verification
        </Text>
        <Text color="var(--muted)" m="0 0 3">
          Enter the 6-digit code from your authenticator app.
        </Text>
        {searchParams?.error && (
          <Text color="#f59e0b" m="0">
            {searchParams.error}
          </Text>
        )}
        <Stack spacing="3">
          <FormControl>
            <FormLabel color="var(--muted)">Verification code</FormLabel>
            <Input name="code" type="text" inputMode="numeric" bg="var(--card)" borderColor="var(--border)" required />
          </FormControl>
        </Stack>
        <Button type="submit" bg="var(--primary)" color="#fff" fontWeight="700">
          Verify
        </Button>
        <Text color="var(--muted)" m="0">
          Having trouble?{" "}
          <Link href="/auth/login" color="var(--accent)">
            Return to login
          </Link>
        </Text>
      </Box>
    </Box>
  );
}
