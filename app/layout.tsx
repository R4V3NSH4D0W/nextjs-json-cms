import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CMS",
  description: "Media library and storefront CMS (Prisma, session auth).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${sans.variable}`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
