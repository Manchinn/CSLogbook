import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
