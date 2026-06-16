"use client";

import { useState, useEffect, useCallback } from "react";
import { useReadContract, useAccount } from "wagmi";
import { Navbar } from "@/components/Navbar";
import { PhotoCard } from "@/components/PhotoCard";
import { AgentPanel } from "@/components/AgentPanel";
import { EVENT_PROOF_ABI, CONTRACT_ADDRESS, Photo } from "@/lib/contract";

const PAGE_SIZE = 12n;

function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3] rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-10 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const { address } = useAccount();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [licences, setLicences] = useState<Map<bigint, boolean>>(new Map());
  const [offset, setOffset] = useState(0n);
  const [total, setTotal] = useState(0n);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data: galleryData, isLoading, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: EVENT_PROOF_ABI,
    functionName: "getActivePhotos",
    args: [offset, PAGE_SIZE],
  });

  useEffect(() => {
    if (!galleryData) return;
    const [rawPhotos, totalCount] = galleryData as [readonly {
      id: bigint; photographer: string; metadataURI: string;
      fileHash: string; price: bigint; active: boolean;
      salesCount: bigint; totalEarned: bigint;
    }[], bigint];

    const mapped: Photo[] = rawPhotos.map((p) => ({
      id: p.id,
      photographer: p.photographer,
      metadataURI: p.metadataURI,
      fileHash: p.fileHash,
      price: p.price,
      active: p.active,
      salesCount: p.salesCount,
      totalEarned: p.totalEarned,
      title: `Frame #${p.id}`,
      category: Number(p.id) % 3 === 0 ? "wedding" : Number(p.id) % 3 === 1 ? "portrait" : "corporate",
    }));
    setPhotos(mapped);
    setTotal(totalCount);
  }, [galleryData]);

  const handlePurchased = useCallback(() => {
    refetch();
  }, [refetch]);

  const displayPhotos = photos.filter((p) => {
    if (category !== "all" && p.category !== category) return false;
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = total === 0n ? 1n : (total + PAGE_SIZE - 1n) / PAGE_SIZE;
  const currentPage = offset / PAGE_SIZE + 1n;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-radial from-arc-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-arc-600/20 border border-arc-500/30 text-arc-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-arc-400 animate-pulse"></span>
            Live on ARC Testnet
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight">
            Own Your{" "}
            <span className="gradient-text">Moment</span>
          </h1>
          <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Purchase photo licences on-chain. Pay USDC, receive a proof-of-purchase NFT.
            Your purchase lives forever on ARC blockchain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-white/40">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-arc-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Instant NFT proof of purchase
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-arc-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Payment direct to photographer
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-arc-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              File hash stored on-chain
            </span>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search frames…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 text-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["all", "wedding", "portrait", "corporate"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  category === cat
                    ? "bg-arc-600 text-white"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="text-white/40 text-sm ml-auto">
            {isLoading ? "Loading…" : `${Number(total)} photo${Number(total) !== 1 ? "s" : ""} available`}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000" ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Contract not deployed yet</h3>
            <p className="text-white/50 max-w-md mx-auto">
              Deploy the EventProof contract to ARC Testnet and set{" "}
              <code className="text-arc-400">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in your{" "}
              <code className="text-arc-400">.env.local</code> file.
            </p>
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 btn-secondary"
            >
              Open ArcScan Explorer ↗
            </a>
          </div>
        ) : displayPhotos.length === 0 && !isLoading ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No photos listed yet</h3>
            <p className="text-white/50">The photographer hasn&apos;t listed any frames yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayPhotos.map((photo) => (
              <PhotoCard
                key={photo.id.toString()}
                photo={photo}
                hasLicence={licences.get(photo.id) ?? false}
                onPurchased={handlePurchased}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setOffset((o) => (o >= PAGE_SIZE ? o - PAGE_SIZE : 0n))}
              disabled={currentPage <= 1n}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-white/50 text-sm">
              Page {Number(currentPage)} of {Number(totalPages)}
            </span>
            <button
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              disabled={currentPage >= totalPages}
              className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </section>

      {/* Agent Panel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <AgentPanel onPurchase={handlePurchased} />
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <span className="w-2 h-2 rounded-full bg-arc-500"></span>
            EventProof · ARC Testnet
          </div>
          <div className="flex items-center gap-4 text-sm text-white/30">
            <a
              href={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors"
            >
              Contract ↗
            </a>
            <a href="https://docs.arc.network" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
              ARC Docs ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
