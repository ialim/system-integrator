import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Button, FormControl, FormLabel, Input, Stack, Text } from "@chakra-ui/react";

async function action(formData: FormData) {
  "use server";
  const token = formData.get("token")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  const name = formData.get("name")?.toString() || "";
  if (!token || !password) return;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/accept-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, name })
  });

  if (!res.ok) {
    let msg = "Invite acceptance failed";
    try {
      const body = await res.json();
      msg = body?.message || msg;
    } catch {
      // ignore parse error
    }
    redirect(`/auth/invite?token=${encodeURIComponent(token)}&error=${encodeURIComponent(msg)}`);
  }

  const data = await res.json();
  cookies().set("token", data.access_token, { httpOnly: true, path: "/" });
  if (data.refresh_token) {
    cookies().set("refresh_token", data.refresh_token, { httpOnly: true, path: "/" });
  }
  redirect("/projects");
}

export default function AcceptInvitePage({ searchParams }: { searchParams?: { token?: string; error?: string } }) {
  const token = searchParams?.token || "";

  if (!token) {
    return (
      <Box as="main" display="grid" placeItems="center" minH="80vh">
        <Box bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5">
          <Text fontSize="lg" fontWeight="700">
            Missing invite token
          </Text>
          <Text color="var(--muted)">Ask your org admin to resend the invite.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box as="main" display="grid" placeItems="center" minH="80vh">
      <Box
        as="form"
        action={action}
        w="100%"
        maxW="440px"
        bg="var(--panel)"
        border="1px solid var(--border)"
        borderRadius="14px"
        p="5"
        gap="3"
        display="grid"
      >
        <Text as="h1" fontSize="xl" fontWeight="700" m="0 0 2">
          Accept invite
        </Text>
        <Text color="var(--muted)" m="0 0 3">
          Set your name and password to join the workspace.
        </Text>
        {searchParams?.error && (
          <Text color="#f59e0b" m="0">
            {searchParams.error}
          </Text>
        )}
        <input type="hidden" name="token" value={token} />
        <Stack spacing="3">
          <FormControl>
            <FormLabel color="var(--muted)">Name</FormLabel>
            <Input name="name" type="text" bg="var(--card)" borderColor="var(--border)" />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Password</FormLabel>
            <Input name="password" type="password" bg="var(--card)" borderColor="var(--border)" required />
          </FormControl>
        </Stack>
        <Button type="submit" bg="var(--primary)" color="#fff" fontWeight="700">
          Join workspace
        </Button>
      </Box>
    </Box>
  );
}
