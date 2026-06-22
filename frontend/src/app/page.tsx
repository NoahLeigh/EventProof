"use client";

import { useState, useEffect, useCallback } from "react";
import { useReadContract } from "wagmi";
import { Navbar } from "@/components/Navbar";
import { PhotoCard } from "@/components/PhotoCard";
import { AgentPanel } from "@/components/AgentPanel";
import { EVENT_PROOF_ABI, CONTRACT_ADDRESS, Photo } from "@/lib/contract";

const PAGE_SIZE = 12n;

const CATEGORIES = ["all", "wedding", "portrait", "corporate"] as const;
type Cat = typeof CATEGORIES[number];
const CAT_LABELS: Record<Cat, string> = { all: "All", wedding: "Wedding", portrait: "Portrait", corporate: "Corporate" };

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3]" style={{ borderRadius: "12px 12px 0 0" }}/>
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-4 w-2/3 rounded"/>
        <div className="skeleton h-3 w-1/2 rounded"/>
        <div className="skeleton h-8 w-full rounded-lg mt-1"/>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [photos, setPhotos]   = useState<Photo[]>([]);
  const [licences]            = useState<Map<bigint, boolean>>(new Map());
  const [offset, setOffset]   = useState(0n);
  const [total, setTotal]     = useState(0n);
  const [search, setSearch]   = useState("");
  const [cat, setCat]         = useState<Cat>("all");

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: EVENT_PROOF_ABI,
    functionName: "getActivePhotos",
    args: [offset, PAGE_SIZE],
  });

  useEffect(() => {
    if (!data) return;
    const [raw, cnt] = data as [readonly { id: bigint; photographer: string; metadataURI: string; fileHash: string; price: bigint; active: boolean; salesCount: bigint; totalEarned: bigint; }[], bigint];
    setPhotos(raw.map((p) => ({
      ...p,
      title: `Frame #${p.id}`,
      category: Number(p.id) % 3 === 0 ? "wedding" : Number(p.id) % 3 === 1 ? "portrait" : "corporate",
    })));
    setTotal(cnt);
  }, [data]);

  const onPurchased = useCallback(() => refetch(), [refetch]);

  const displayed = photos.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages  = total === 0n ? 1n : (total + PAGE_SIZE - 1n) / PAGE_SIZE;
  const currentPage = offset / PAGE_SIZE + 1n;
  const deployed    = CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="pt-28 pb-16 px-5 sm:px-8 border-b border-[#e4e4e4]">
        <div className="max-w-7xl mx-auto">
          {/* Live pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e4e4e4] bg-[#f7f7f7] text-[#4a4a4a] text-xs font-semibold mb-6 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"/>
            Live on ARC Testnet
          </div>

          <h1 className="text-[clamp(3rem,8vw,6.5rem)] font-black text-[#0a0a0a] leading-none tracking-tight mb-6">
            Own Your<br/>
            <span className="text-[#1a1aff]">Moment.</span>
          </h1>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <p className="text-[#4a4a4a] text-lg max-w-lg leading-relaxed">
              Purchase photo licences on-chain. Pay USDC, receive a proof-of-purchase NFT stored forever on ARC blockchain.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-[#4a4a4a] flex-shrink-0">
              {["NFT proof of purchase", "Direct to photographer", "Hash on-chain"].map((f) => (
                <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e4e4e4] bg-[#f7f7f7]">
                  <span className="text-green-600">✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER BAR ─────────────────────────────────────── */}
      <section className="sticky top-14 z-30 bg-white border-b border-[#e4e4e4]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 py-1.5 text-sm h-9"
            />
          </div>

          {/* Category chips */}
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`chip text-xs ${cat === c ? "active" : ""}`}>
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>

          <div className="text-[#8a8a8a] text-sm sm:ml-auto">
            {isLoading ? "Loading…" : `${Number(total)} frame${Number(total) !== 1 ? "s" : ""}`}
          </div>
        </div>
      </section>

      {/* ── GALLERY ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : !deployed ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5 text-amber-500">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0a0a0a] mb-2">Contract not deployed</h3>
            <p className="text-[#8a8a8a] text-sm max-w-sm mx-auto">
              Set <code className="bg-[#f0f0f0] px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in your .env.local file.
            </p>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="btn-secondary mt-6 text-sm">
              Open ArcScan ↗
            </a>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f7f7f7] border border-[#e4e4e4] flex items-center justify-center mx-auto mb-5 text-[#c4c4c4]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#0a0a0a] mb-2">No frames found</h3>
            <p className="text-[#8a8a8a] text-sm">
              {search || cat !== "all" ? "Try a different search or filter." : "No photos listed yet."}
            </p>
            {(search || cat !== "all") && (
              <button onClick={() => { setSearch(""); setCat("all"); }} className="btn-ghost mt-4 text-sm text-[#1a1aff]">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayed.map((photo) => (
                <PhotoCard key={photo.id.toString()} photo={photo} hasLicence={licences.get(photo.id) ?? false} onPurchased={onPurchased}/>
              ))}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setOffset((o) => (o >= PAGE_SIZE ? o - PAGE_SIZE : 0n))}
                  disabled={currentPage <= 1n}
                  className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-30"
                >
                  ← Prev
                </button>
                <span className="text-sm text-[#8a8a8a] px-3">
                  {Number(currentPage)} / {Number(totalPages)}
                </span>
                <button
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                  disabled={currentPage >= totalPages}
                  className="btn-secondary py-1.5 px-3 text-sm disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── AGENT PANEL ────────────────────────────────────── */}
      <section className="bg-white/60 backdrop-blur-sm border-t border-[#e4e4e4] py-16 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="section-label mb-2">Automation</p>
            <h2 className="text-3xl font-black text-[#0a0a0a] tracking-tight">Agent Simulation</h2>
          </div>
          <AgentPanel onPurchase={onPurchased}/>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-[#e4e4e4] py-8 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#8a8a8a]">
          <div className="font-bold text-[#0a0a0a] tracking-tight">EventProof</div>
          <div className="flex items-center gap-5">
            <a href={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#0a0a0a] transition-colors">
              Contract ↗
            </a>
            <a href="https://docs.arc.network" target="_blank" rel="noopener noreferrer" className="hover:text-[#0a0a0a] transition-colors">
              ARC Docs ↗
            </a>
            <span className="font-mono text-xs text-[#c4c4c4]">
              {CONTRACT_ADDRESS.slice(0, 8)}…{CONTRACT_ADDRESS.slice(-6)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
