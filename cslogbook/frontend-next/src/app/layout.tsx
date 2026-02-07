import type { Metadata } from "next";
import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSLogbook Frontend",
  description: "Next.js + TypeScript starter for CSLogbook frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
