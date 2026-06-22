import type { Metadata } from "next";
import { Cardo, Jost } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Backdrop } from "@/components/Backdrop";

// Editorial serif display + clean sans body
const serif = Cardo({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EventProof — Nocturne · Photo Licensing on ARC",
  description:
    "Per-frame proof-of-purchase for event photography. Pay USDC, receive a proof-of-purchase NFT. Built on ARC Testnet.",
  keywords: ["NFT", "photo", "licence", "ARC", "USDC", "blockchain", "Web3", "wedding", "event"],
  openGraph: {
    title: "EventProof — Nocturne",
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
    <html lang="en" className={`scroll-smooth ${serif.variable} ${sans.variable}`}>
      <head>
        {/* Favicon — bespoke lily / aperture mark on dark ground */}
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%230a1310'/%3E%3Cg%3E%3Cg fill='none' stroke='%23d9b24f' stroke-width='1.6'%3E%3Cellipse cx='24' cy='12.5' rx='4.4' ry='10.5'/%3E%3Cellipse cx='24' cy='12.5' rx='4.4' ry='10.5' transform='rotate(60 24 24)'/%3E%3Cellipse cx='24' cy='12.5' rx='4.4' ry='10.5' transform='rotate(120 24 24)'/%3E%3Cellipse cx='24' cy='12.5' rx='4.4' ry='10.5' transform='rotate(180 24 24)'/%3E%3Cellipse cx='24' cy='12.5' rx='4.4' ry='10.5' transform='rotate(240 24 24)'/%3E%3Cellipse cx='24' cy='12.5' rx='4.4' ry='10.5' transform='rotate(300 24 24)'/%3E%3C/g%3E%3Ccircle cx='24' cy='24' r='2' fill='%23d9b24f'/%3E%3C/g%3E%3C/svg%3E"
        />
      </head>
      <body className="antialiased">
        <Backdrop />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
