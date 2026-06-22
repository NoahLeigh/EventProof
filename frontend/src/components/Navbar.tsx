"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useAccount, useConnect, useDisconnect,
  useChainId, useSwitchChain, useBalance
} from "wagmi";
import { injected } from "wagmi/connectors";
import { shortenAddress, ARC_TESTNET_CHAIN_ID } from "@/lib/contract";
import { useState, useEffect } from "react";

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6"  y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export function Navbar() {
  const pathname  = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  // Balance
  const { data: balanceData } = useBalance({
    address: address,
    query: { enabled: isConnected && !!address },
  });

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET_CHAIN_ID;

  // Auto-switch to ARC Testnet on connect
  useEffect(() => {
    if (isConnected && isWrongNetwork && !isSwitching) {
      switchChain({ chainId: ARC_TESTNET_CHAIN_ID });
    }
  }, [isConnected, isWrongNetwork, isSwitching, switchChain]);

  const links = [
    { href: "/",          label: "Gallery"    },
    { href: "/dashboard", label: "Dashboard"  },
    { href: "/list",      label: "List Frame" },
  ];

  // Format balance
  function formatBalance(val: bigint, decimals: number): string {
    const divisor = 10 ** decimals;
    const num = Number(val) / divisor;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    if (num >= 1) return num.toFixed(2);
    return num.toFixed(4);
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e4e4e4]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="font-black text-[#0a0a0a] text-lg tracking-tight leading-none select-none">
            EventProof
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? "bg-[#f0f0f0] text-[#0a0a0a]"
                    : "text-[#6a6a6a] hover:bg-[#f7f7f7] hover:text-[#0a0a0a]"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-[#8a8a8a] hover:bg-[#f7f7f7] hover:text-[#0a0a0a] transition-colors flex items-center gap-1"
            >
              Explorer
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-2.5 h-2.5">
                <path d="M1 11 10 2M10 2H4M10 2v6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </nav>

          {/* Right: wallet + burger */}
          <div className="flex items-center gap-2">
            {/* Switching network indicator */}
            {isSwitching && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#e4e4e4] bg-[#f7f7f7] text-[#8a8a8a] text-xs font-medium">
                <Spinner />
                Switching to ARC…
              </div>
            )}

            {/* Wrong network (manual switch fallback) */}
            {isWrongNetwork && !isSwitching && (
              <button
                onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>
                Switch to ARC
              </button>
            )}

            {isConnected && address ? (
              <div className="flex items-center gap-2">
                {/* Balance + address badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#f7f7f7] border border-[#e4e4e4] text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"/>
                  {balanceData && (
                    <span className="text-[#1a1aff] font-semibold tabular-nums">
                      {formatBalance(balanceData.value, balanceData.decimals)} {balanceData.symbol}
                    </span>
                  )}
                  <span className="text-[#c4c4c4]">|</span>
                  <span className="text-[#4a4a4a] font-mono tracking-tight">
                    {shortenAddress(address)}
                  </span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="btn-ghost text-xs text-[#8a8a8a]"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: injected() })}
                disabled={isPending}
                className="btn-primary text-sm py-1.5 px-4"
              >
                {isPending ? <><Spinner /> Connecting…</> : "Connect Wallet"}
              </button>
            )}

            {/* Mobile burger */}
            <button
              className="md:hidden btn-ghost p-1.5"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <IconX /> : <IconMenu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-14">
          <nav className="p-5 flex flex-col gap-1 border-t border-[#e4e4e4]">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  pathname === l.href
                    ? "bg-[#f0f0f0] text-[#0a0a0a]"
                    : "text-[#4a4a4a] hover:bg-[#f7f7f7]"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 rounded-xl text-base font-medium text-[#8a8a8a]"
              onClick={() => setOpen(false)}
            >
              Explorer ↗
            </a>
            {/* Balance on mobile */}
            {isConnected && balanceData && (
              <div className="mt-3 px-4 py-3 rounded-xl bg-[#f7f7f7] border border-[#e4e4e4]">
                <p className="text-xs text-[#8a8a8a] mb-1">Balance</p>
                <p className="text-[#1a1aff] font-bold">
                  {formatBalance(balanceData.value, balanceData.decimals)} {balanceData.symbol}
                </p>
              </div>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
