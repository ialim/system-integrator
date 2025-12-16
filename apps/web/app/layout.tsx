import "./globals.css";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { Space_Grotesk } from "next/font/google";
import { Providers } from "./providers";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { fetchProfile } from "../lib/auth";

const font = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata = {
  title: "Smart Integrator Platform",
  description: "Project designer and wholesale portal for smart products"
};

async function getUser() {
  const token = cookies().get("token")?.value || null;
  if (!token) return { token: null, user: null };
  try {
    const user = await fetchProfile(token);
    return { token, user };
  } catch {
    return { token, user: null };
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getUser();

  return (
    <html lang="en" className={font.variable}>
      <body>
        <Providers>
          <div className="app-shell">
            <Sidebar user={session.user} />
            <div className="app-main">
              <Header user={session.user} />
              <div className="app-content">{children}</div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
