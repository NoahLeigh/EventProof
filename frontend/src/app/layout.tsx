import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "EventProof — Photo Licensing on ARC",
  description:
    "Purchase photo licences on-chain. Pay USDC, receive a proof-of-purchase NFT. Built on ARC Testnet.",
  keywords: ["NFT", "photo", "licence", "ARC", "USDC", "blockchain", "Web3"],
  openGraph: {
    title: "EventProof",
    description: "On-chain photo licensing — buy a frame, own the proof.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Favicon — camera aperture SVG */}
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230a0a0a'/%3E%3Ccircle cx='16' cy='16' r='7' fill='none' stroke='%231a1aff' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='3.5' fill='%231a1aff'/%3E%3Cpath d='M11 8.5 L10 6 L22 6 L21 8.5' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
