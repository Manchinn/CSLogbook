import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import { AppProviders } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  variable: "--font-thai",
  display: "swap",
});

const notoSerifThai = Noto_Serif_Thai({
  subsets: ["thai"],
  weight: ["400", "600", "700"],
  variable: "--font-serif-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CS Logbook",
  description: "ระบบบันทึกและติดตามการฝึกงาน โครงงานพิเศษและปริญญานิพนธ์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${inter.variable} ${notoSansThai.variable} ${notoSerifThai.variable}`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
