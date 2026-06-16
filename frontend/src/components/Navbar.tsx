"use client";

import Link from "next/link";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { shortenAddress } from "@/lib/contract";
import { ARC_TESTNET_CHAIN_ID } from "@/lib/contract";
import { useState } from "react";

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [menuOpen, setMenuOpen] = useState(false);

  const isWrongNetwork = isConnected && chainId !== ARC_TESTNET_CHAIN_ID;

  function handleConnect() {
    connect({ connector: injected() });
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-arc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-arc-400 to-arc-700 flex items-center justify-center shadow-lg shadow-arc-600/30">
              <svg viewBox="0 0 24 24" fill="none" className="w-4.5 h-4.5 text-white" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight group-hover:text-arc-300 transition-colors">
              EventProof
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Gallery
            </Link>
            <Link href="/dashboard" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              Dashboard
            </Link>
            <Link href="/list" className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              List Photo
            </Link>
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white/80 text-sm font-medium transition-colors flex items-center gap-1"
            >
              Explorer
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          </div>

          {/* Wallet */}
          <div className="flex items-center gap-3">
            {isWrongNetwork && (
              <button
                onClick={() => switchChain({ chainId: ARC_TESTNET_CHAIN_ID })}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-semibold hover:bg-amber-500/30 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                Switch to ARC
              </button>
            )}

            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-white/80 text-sm font-mono">{shortenAddress(address)}</span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-sm transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isPending}
                className="btn-primary py-2 px-4 text-sm"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
