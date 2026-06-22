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
      <div className="skeleton aspect-[4/3]" style={{ borderRadius: "3px 3px 0 0" }}/>
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-4 w-2/3 rounded"/>
        <div className="skeleton h-3 w-1/2 rounded"/>
        <div className="skeleton h-8 w-full rounded mt-1"/>
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
      <section className="pt-36 sm:pt-44 pb-20 px-5 sm:px-8 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {/* Live pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-2)] bg-[var(--bg-2)] text-[var(--text-2)] text-xs font-semibold mb-8 tracking-[0.15em] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"/>
            Live on ARC Testnet
          </div>

          <p className="meta-text mb-5">An on-chain photography album · Per-frame proof of purchase</p>

          <h1 className="display text-[clamp(3.2rem,9vw,7.5rem)] text-[var(--text-1)] mb-8">
            Own the<br/>
            Moment <span className="gold-text italic">&amp;</span> the Proof
          </h1>

          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end justify-between">
            <p className="text-[var(--text-2)] text-lg max-w-lg leading-relaxed font-light">
              Buy a single event frame on-chain. Pay USDC, receive a proof-of-purchase
              NFT — the photographer is paid directly, the licence is yours forever on ARC.
            </p>
            <div className="flex flex-wrap gap-2.5 text-sm text-[var(--text-2)] flex-shrink-0">
              {["NFT proof of purchase", "Direct to photographer", "Hash on-chain"].map((f) => (
                <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-2)] bg-[var(--bg-1)]">
                  <span className="text-[var(--gold)]">✦</span> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER BAR ─────────────────────────────────────── */}
      <section className="sticky top-16 sm:top-[5.75rem] z-30 bg-[#0a1310]/85 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
            <input
              type="text"
              placeholder="Search the album…"
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

          <div className="meta-text sm:ml-auto">
            {isLoading ? "Loading…" : `${Number(total)} frame${Number(total) !== 1 ? "s" : ""}`}
          </div>
        </div>
      </section>

      {/* ── GALLERY ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="section-label mb-2">The Album</p>
            <h2 className="display text-3xl sm:text-4xl text-[var(--text-1)]">Frames for collection</h2>
          </div>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : !deployed ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--gold-bg)] border border-[rgba(217,178,79,0.4)] flex items-center justify-center mx-auto mb-5 text-[var(--gold)]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
            </div>
            <h3 className="display text-2xl text-[var(--text-1)] mb-2">Contract not deployed</h3>
            <p className="text-[var(--text-3)] text-sm max-w-sm mx-auto">
              Set <code className="bg-[var(--bg-2)] px-1.5 py-0.5 rounded text-xs text-[var(--gold)]">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in your .env.local file.
            </p>
            <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="btn-secondary mt-6 text-sm">
              Open ArcScan ↗
            </a>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-2)] border border-[var(--border-2)] flex items-center justify-center mx-auto mb-5 text-[var(--text-3)]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/>
              </svg>
            </div>
            <h3 className="display text-2xl text-[var(--text-1)] mb-2">No frames found</h3>
            <p className="text-[var(--text-3)] text-sm">
              {search || cat !== "all" ? "Try a different search or filter." : "No photos listed yet."}
            </p>
            {(search || cat !== "all") && (
              <button onClick={() => { setSearch(""); setCat("all"); }} className="btn-ghost mt-4 text-sm text-[var(--gold)]">
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
                <span className="text-sm text-[var(--text-2)] px-3 font-mono">
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
      <section className="border-t border-[var(--border)] py-16 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <p className="section-label mb-2">Automation · Client-side demo</p>
            <h2 className="display text-3xl sm:text-4xl text-[var(--text-1)]">Agent Simulation</h2>
          </div>
          <AgentPanel onPurchase={onPurchased}/>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-10 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--text-3)]">
          <div className="display text-xl text-[var(--text-1)]">
            Event<span className="gold-text">Proof</span>
          </div>
          <div className="flex items-center gap-5">
            <a href={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gold)] transition-colors">
              Contract ↗
            </a>
            <a href="https://docs.arc.network" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gold)] transition-colors">
              ARC Docs ↗
            </a>
            <span className="font-mono text-xs text-[var(--text-3)]">
              {CONTRACT_ADDRESS.slice(0, 8)}…{CONTRACT_ADDRESS.slice(-6)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
