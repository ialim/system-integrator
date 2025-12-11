import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { Header } from "../components/Header";

export const metadata = {
  title: "Smart Integrator Platform",
  description: "Project designer and wholesale portal for smart products"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
            <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
              <Header />
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
