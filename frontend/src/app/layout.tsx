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
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
