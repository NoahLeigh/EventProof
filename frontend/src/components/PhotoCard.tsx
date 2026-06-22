"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { EVENT_PROOF_ABI, CONTRACT_ADDRESS, Photo, formatUsdc } from "@/lib/contract";

interface PhotoCardProps {
  photo: Photo;
  hasLicence: boolean;
  onPurchased?: () => void;
}

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80",
];

function getPlaceholderImage(id: bigint): string {
  return PLACEHOLDER_IMAGES[Number(id) % PLACEHOLDER_IMAGES.length];
}

const CATEGORY_LABELS: Record<string, string> = {
  wedding: "Wedding",
  portrait: "Portrait",
  corporate: "Corporate",
  event: "Event",
  other: "Photo",
};

export function PhotoCard({ photo, hasLicence, onPurchased }: PhotoCardProps) {
  const { isConnected } = useAccount();
  const [imgError, setImgError] = useState(false);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isProcessing = isPending || isConfirming;
  const purchased = hasLicence || isSuccess;

  const displayImage = !imgError && photo.imageUrl ? photo.imageUrl : getPlaceholderImage(photo.id);
  const title = photo.title || `Frame #${photo.id}`;
  const category = photo.category || "other";
  const price = formatUsdc(photo.price);

  function handlePurchase() {
    if (!isConnected || purchased || isProcessing) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_PROOF_ABI,
      functionName: "purchasePhoto",
      args: [photo.id],
      value: photo.price,
    });
  }

  return (
    <div className="card-hover group overflow-hidden flex flex-col animate-fade-in">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-arc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImgError(true)}
        />

        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="badge-blue capitalize">{CATEGORY_LABELS[category] ?? "Photo"}</span>
          {purchased && (
            <span className="badge-green">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Licensed
            </span>
          )}
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-bold">
            ${price} USDC
          </span>
        </div>

        {/* File hash indicator */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white/60 text-xs font-mono truncate">
            SHA256: {photo.fileHash.slice(0, 18)}…
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-white font-semibold text-base leading-tight line-clamp-1">{title}</h3>
          {photo.description && (
            <p className="text-white/50 text-sm mt-1 line-clamp-2">{photo.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            {Number(photo.salesCount)} sold
          </span>
          {photo.location && (
            <span className="flex items-center gap-1 truncate">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {photo.location}
            </span>
          )}
        </div>

        {/* Button */}
        <div className="mt-auto pt-1">
          {!isConnected ? (
            <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed text-sm py-2.5">
              Connect wallet to purchase
            </button>
          ) : purchased ? (
            <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Licence Owned
            </div>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="btn-primary w-full text-sm py-2.5 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {isPending ? "Confirm in wallet…" : "Confirming…"}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  Buy Licence — ${price} USDC
                </>
              )}
            </button>
          )}
        </div>

        {/* TX link */}
        {txHash && (
          <a
            href={`https://testnet.arcscan.app/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-arc-400 text-xs text-center hover:underline"
          >
            View transaction ↗
          </a>
        )}
      </div>
    </div>
  );
}
