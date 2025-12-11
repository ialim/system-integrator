"use client";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import type { ReactNode } from "react";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "#0b1021",
        color: "#f5f7fb"
      }
    }
  },
  colors: {
    brand: {
      500: "#1f6feb"
    }
  }
});

export function Providers({ children }: { children: ReactNode }) {
  return <ChakraProvider theme={theme}>{children}</ChakraProvider>;
}
