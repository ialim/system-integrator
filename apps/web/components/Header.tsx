import { Button, Flex, HStack, Link, Text, Avatar, Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import { cookies } from "next/headers";
import { fetchProfile, logout } from "../lib/auth";

export async function Header() {
  const token = cookies().get("token")?.value || null;
  let user: any = null;
  if (token) {
    try {
      user = await fetchProfile(token);
    } catch {
      user = null;
    }
  }

  async function logoutAction() {
    "use server";
    await logout();
  }

  return (
    <Flex
      as="header"
      border="1px solid"
      borderColor="var(--border)"
      borderRadius="14px"
      p="3"
      bg="var(--panel)"
      align="center"
      justify="space-between"
      mb="4"
    >
      <HStack spacing="3" align="center">
        <Text color="var(--accent)" letterSpacing="0.08em" fontWeight="700">
          INTEGRATOR
        </Text>
        <Link href="/" color="var(--text)" fontWeight="600">
          Catalog
        </Link>
        <Link href="/projects" color="var(--text)" fontWeight="600">
          Projects
        </Link>
      </HStack>
      {user ? (
        <Menu>
          <MenuButton as={Button} variant="ghost" color="var(--text)" leftIcon={<Avatar size="sm" name={user.email} />}>
            {user.email} • {user.role}
          </MenuButton>
          <MenuList bg="var(--panel)" borderColor="var(--border)">
            <MenuItem as="a" href="/projects" bg="var(--panel)" color="var(--text)">
              Projects
            </MenuItem>
            <form action={logoutAction}>
              <MenuItem as="button" type="submit" bg="var(--panel)" color="var(--text)">
                Logout
              </MenuItem>
            </form>
          </MenuList>
        </Menu>
      ) : (
        <HStack spacing="2">
          <Link href="/auth/login" color="var(--muted)" fontWeight="600">
            Login
          </Link>
          <Button as={Link} href="/auth/signup" size="sm" bg="var(--primary)" color="#fff" fontWeight="700">
            Sign up
          </Button>
        </HStack>
      )}
    </Flex>
  );
}
