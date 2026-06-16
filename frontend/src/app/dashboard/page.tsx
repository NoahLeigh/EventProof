"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { Navbar } from "@/components/Navbar";
import {
  EVENT_PROOF_ABI,
  CONTRACT_ADDRESS,
  Photo,
  formatUsdc,
  shortenAddress,
} from "@/lib/contract";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [photos, setPhotos] = useState<Photo[]>([]);

  const { data: galleryData, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: EVENT_PROOF_ABI,
    functionName: "getActivePhotos",
    args: [0n, 50n],
  });

  const { data: sessionData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: EVENT_PROOF_ABI,
    functionName: "getSessionStats",
  });

  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: EVENT_PROOF_ABI,
    functionName: "owner",
  });

  useEffect(() => {
    if (!galleryData) return;
    const [rawPhotos] = galleryData as [
      readonly {
        id: bigint; photographer: string; metadataURI: string;
        fileHash: string; price: bigint; active: boolean;
        salesCount: bigint; totalEarned: bigint;
      }[],
      bigint
    ];
    setPhotos(
      rawPhotos.map((p) => ({
        id: p.id,
        photographer: p.photographer,
        metadataURI: p.metadataURI,
        fileHash: p.fileHash,
        price: p.price,
        active: p.active,
        salesCount: p.salesCount,
        totalEarned: p.totalEarned,
        title: `Frame #${p.id}`,
      }))
    );
  }, [galleryData]);

  const [totalSales, totalEarned, sessionDuration] = (sessionData as [bigint, bigint, bigint]) ?? [0n, 0n, 0n];
  const isOwner = contractOwner && address && (contractOwner as string).toLowerCase() === address.toLowerCase();

  const totalRevenue = photos.reduce((acc, p) => acc + p.totalEarned, 0n);
  const totalSold = photos.reduce((acc, p) => acc + p.salesCount, 0n);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 mt-1">
            Contract stats and photographer earnings overview
          </p>
        </div>

        {/* Contract info */}
        <div className="card p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">Contract Address</p>
            <a
              href={`https://testnet.arcscan.app/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-arc-300 font-mono text-sm hover:underline"
            >
              {CONTRACT_ADDRESS}
            </a>
          </div>
          {isConnected && (
            <div className="flex items-center gap-2">
              {isOwner ? (
                <span className="badge-green">Owner</span>
              ) : (
                <span className="badge-blue">Viewer</span>
              )}
              <span className="text-white/40 text-sm font-mono">{shortenAddress(address!)}</span>
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Photos Listed</p>
            <p className="text-3xl font-bold text-white">{isLoading ? "—" : photos.length}</p>
          </div>
          <div className="stat-card">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Total Sales</p>
            <p className="text-3xl font-bold text-arc-300">{isLoading ? "—" : Number(totalSold)}</p>
          </div>
          <div className="stat-card">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Revenue</p>
            <p className="text-3xl font-bold text-emerald-400">${isLoading ? "—" : formatUsdc(totalRevenue)}</p>
          </div>
          <div className="stat-card">
            <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Session Sales</p>
            <p className="text-3xl font-bold text-white">{Number(totalSales)}</p>
            <p className="text-white/30 text-xs">${formatUsdc(totalEarned)} earned</p>
          </div>
        </div>

        {/* Photos table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h2 className="text-white font-semibold">Listed Frames</h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-white/40">Loading…</div>
          ) : photos.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/30">No photos listed yet.</p>
              {isOwner && (
                <a href="/list" className="inline-block mt-4 btn-primary text-sm">
                  + List your first frame
                </a>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">ID</th>
                    <th className="text-left px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">File Hash</th>
                    <th className="text-right px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Price</th>
                    <th className="text-right px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Sales</th>
                    <th className="text-right px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Earned</th>
                    <th className="text-center px-5 py-3 text-white/40 text-xs font-medium uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {photos.map((p) => (
                    <tr key={p.id.toString()} className="hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-white font-mono text-sm">#{Number(p.id)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-white/40 font-mono text-xs">
                          {p.fileHash.slice(0, 14)}…
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-white text-sm">${formatUsdc(p.price)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-white text-sm">{Number(p.salesCount)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-emerald-400 text-sm font-medium">${formatUsdc(p.totalEarned)}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={p.active ? "badge-green" : "badge text-white/30 bg-white/5 border border-white/10"}>
                          {p.active ? "Active" : "Delisted"}
                        </span>
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
