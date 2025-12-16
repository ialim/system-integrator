import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Button, FormControl, FormLabel, Input, Link, Stack, Text } from "@chakra-ui/react";

async function action(formData: FormData) {
  "use server";
  const email = formData.get("email")?.toString() || "";
  const password = formData.get("password")?.toString() || "";
  if (!email || !password) return;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    let msg = "Login failed";
    try {
      const body = await res.json();
      msg = body?.message || msg;
    } catch {
      // ignore parse error, use fallback
    }
    redirect(`/auth/login?error=${encodeURIComponent(msg)}`);
  }
  const data = await res.json();
  cookies().set("token", data.access_token, { httpOnly: true, path: "/" });
  redirect("/projects");
}

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <Box as="main" display="grid" placeItems="center" minH="80vh">
      <Box as="form" action={action} w="100%" maxW="420px" bg="var(--panel)" border="1px solid var(--border)" borderRadius="14px" p="5" gap="3" display="grid">
        <Text as="h1" fontSize="xl" fontWeight="700" m="0 0 2">
          Login
        </Text>
        <Text color="var(--muted)" m="0 0 3">
          Access your org projects and catalog.
        </Text>
        {searchParams?.error && (
          <Text color="#f59e0b" m="0">
            {searchParams.error}
          </Text>
        )}
        <Stack spacing="3">
          <FormControl>
            <FormLabel color="var(--muted)">Email</FormLabel>
            <Input name="email" type="email" bg="var(--card)" borderColor="var(--border)" required />
          </FormControl>
          <FormControl>
            <FormLabel color="var(--muted)">Password</FormLabel>
            <Input name="password" type="password" bg="var(--card)" borderColor="var(--border)" required />
          </FormControl>
        </Stack>
        <Button type="submit" bg="var(--primary)" color="#fff" fontWeight="700">
          Login
        </Button>
        <Text color="var(--muted)" m="0">
          No account?{" "}
          <Link href="/auth/signup" color="var(--accent)">
            Sign up
          </Link>
        </Text>
      </Box>
    </Box>
  );
}
