import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Smart Integrator Platform",
  description: "Project designer and wholesale portal for smart products"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
