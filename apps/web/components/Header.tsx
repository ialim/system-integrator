import {
  Avatar,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
  Text
} from "@chakra-ui/react";
import { redirect } from "next/navigation";
import { logout } from "../lib/auth";
import { BellIcon, ChevronDownIcon, RepeatIcon, SearchIcon } from "./icons";

type HeaderProps = {
  user?: { email?: string | null; role?: string | null; name?: string | null } | null;
};

export function Header({ user }: HeaderProps) {
  async function logoutAction() {
    "use server";
    await logout();
    redirect("/auth/login");
  }

  return (
    <Flex
      as="header"
      border="1px solid"
      borderColor="var(--border)"
      borderRadius="16px"
      p="12px 14px"
      bg="linear-gradient(145deg, rgba(18,30,58,0.85), rgba(20,30,60,0.95))"
      align="center"
      justify="space-between"
      boxShadow="0px 20px 60px rgba(0,0,0,0.35)"
      className="glow-card"
    >
      <form style={{ flex: 1, marginRight: "16px" }} action="/">
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none" color="var(--muted)">
            <SearchIcon />
          </InputLeftElement>
          <Input
            name="q"
            placeholder="Search projects or products..."
            bg="rgba(255,255,255,0.02)"
            borderColor="var(--border)"
            _hover={{ borderColor: "var(--border-strong)" }}
            _focusVisible={{ borderColor: "var(--primary)", boxShadow: "0 0 0 1px var(--primary)" }}
          />
        </InputGroup>
      </form>

      <HStack spacing="2">
        <IconButton
          aria-label="Refresh data"
          icon={<RepeatIcon />}
          variant="ghost"
          color="var(--muted)"
          border="1px solid"
          borderColor="var(--border)"
        />
        <IconButton
          aria-label="Notifications"
          icon={<BellIcon />}
          variant="ghost"
          color="var(--muted)"
          border="1px solid"
          borderColor="var(--border)"
        />
        {user ? (
          <Menu>
            <MenuButton
              as={Button}
              variant="ghost"
              color="var(--text)"
              leftIcon={<Avatar size="sm" name={user.email || user.name || "User"} />}
              rightIcon={<ChevronDownIcon />}
              px="3"
            >
              <Stack spacing="0" align="flex-start">
                <Text fontSize="sm" fontWeight="700">
                  {user.email || user.name}
                </Text>
                {user.role && (
                  <Text fontSize="xs" color="var(--muted)">
                    {user.role.toLowerCase()}
                  </Text>
                )}
              </Stack>
            </MenuButton>
            <MenuList bg="var(--panel)" borderColor="var(--border)">
              <MenuItem as={Link} href="/projects" bg="var(--panel)" color="var(--text)">
                Projects
              </MenuItem>
              <MenuItem as={Link} href="/settings/security" bg="var(--panel)" color="var(--text)">
                Security settings
              </MenuItem>
              <MenuItem as={Link} href="/settings/team" bg="var(--panel)" color="var(--text)">
                Team settings
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
      </HStack>
    </Flex>
  );
}
