"use client";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import type { ReactNode } from "react";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-body)"
      }
    }
  },
  colors: {
    brand: {
      500: "#2d6bff"
    }
  },
  fonts: {
    body: "var(--font-body)",
    heading: "var(--font-body)"
  }
});

export function Providers({ children }: { children: ReactNode }) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
}
