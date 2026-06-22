"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Navbar } from "@/components/Navbar";
import { EVENT_PROOF_ABI, CONTRACT_ADDRESS, Photo, formatUsdc, shortenAddress } from "@/lib/contract";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [photos, setPhotos] = useState<Photo[]>([]);

  const { data: galleryData, isLoading } = useReadContract({ address: CONTRACT_ADDRESS, abi: EVENT_PROOF_ABI, functionName: "getActivePhotos", args: [0n, 50n] });
  const { data: sessionData }  = useReadContract({ address: CONTRACT_ADDRESS, abi: EVENT_PROOF_ABI, functionName: "getSessionStats" });
  const { data: contractOwner } = useReadContract({ address: CONTRACT_ADDRESS, abi: EVENT_PROOF_ABI, functionName: "owner" });

  useEffect(() => {
    if (!galleryData) return;
    const [raw] = galleryData as [readonly { id: bigint; photographer: string; metadataURI: string; fileHash: string; price: bigint; active: boolean; salesCount: bigint; totalEarned: bigint; }[], bigint];
    setPhotos(raw.map((p) => ({ ...p, title: `Frame #${p.id}` })));
  }, [galleryData]);

  const [totalSales, totalEarned] = (sessionData as [bigint, bigint, bigint]) ?? [0n, 0n, 0n];
  const isOwner = contractOwner && address && (contractOwner as string).toLowerCase() === address.toLowerCase();
  const totalRevenue = photos.reduce((a, p) => a + p.totalEarned, 0n);
  const totalSold    = photos.reduce((a, p) => a + p.salesCount,  0n);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-32 sm:pt-36 pb-20">

        {/* Page title */}
        <div className="py-10 border-b border-[var(--border)] mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="section-label mb-2">Analytics</p>
            <h1 className="display text-[clamp(2.4rem,6vw,4rem)] text-[var(--text-1)]">
              The <span className="gold-text italic">Ledger</span>
            </h1>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2 pb-1">
              {isOwner
                ? <span className="badge-green">Owner ✦</span>
                : <span className="badge-gray">Viewer</span>
              }
              <span className="text-[var(--text-3)] text-sm font-mono">{shortenAddress(address!)}</span>
            </div>
          )}
        </div>

        {/* Contract banner */}
        <div className="card px-5 py-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="section-label mb-1">Contract</p>
            <a href={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer"
              className="text-[var(--gold)] font-mono text-sm hover:underline break-all">
              {CONTRACT_ADDRESS} ↗
            </a>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(127,209,160,0.35)] bg-[var(--success-bg)] text-[var(--success)] text-xs font-semibold flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]"/>
            ARC Testnet · Verified
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Photos Listed", value: isLoading ? "—" : photos.length, sub: "" },
            { label: "Total Sales",   value: isLoading ? "—" : Number(totalSold), sub: "" },
            { label: "Total Revenue", value: isLoading ? "—" : `$${formatUsdc(totalRevenue)}`, sub: "USDC" },
            { label: "Session Sales", value: Number(totalSales), sub: `$${formatUsdc(totalEarned)} earned` },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <p className="section-label mb-2">{s.label}</p>
              <p className="display text-3xl text-[var(--gold)]">{s.value}</p>
              {s.sub && <p className="text-[var(--text-3)] text-xs mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="display text-xl text-[var(--text-1)]">Listed Frames</h2>
            {isOwner && (
              <a href="/list" className="btn-primary text-xs py-1.5 px-3">+ List Frame</a>
            )}
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-[var(--text-3)] text-sm">Loading…</div>
          ) : photos.length === 0 ? (
            <div className="p-16 flex flex-col items-center gap-4 text-center">
              <svg className="w-10 h-10 text-[var(--border-2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              <p className="text-[var(--text-3)]">No frames listed yet</p>
              {isOwner && <a href="/list" className="btn-primary text-sm">+ List your first frame</a>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {["ID", "File Hash", "Price", "Sales", "Earned", "Status"].map((h, i) => (
                      <th key={h} className="px-5 py-3 section-label" style={{ textAlign: i >= 2 && i < 5 ? "right" : i === 5 ? "center" : "left" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {photos.map((p) => (
                    <tr key={p.id.toString()} className="border-b border-[var(--border)] last:border-0 table-row-hover">
                      <td className="px-5 py-3.5 font-mono font-medium text-[var(--text-1)]">#{Number(p.id)}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[var(--text-3)]">
                        {p.fileHash.slice(0, 10)}…{p.fileHash.slice(-6)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-[var(--text-1)]">${formatUsdc(p.price)}</td>
                      <td className="px-5 py-3.5 text-right text-[var(--text-2)]">{Number(p.salesCount)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[var(--success)]">${formatUsdc(p.totalEarned)}</td>
                      <td className="px-5 py-3.5 text-center">
                        {p.active
                          ? <span className="badge-green">Active</span>
                          : <span className="badge-gray">Delisted</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
