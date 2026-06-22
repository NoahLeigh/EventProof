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
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=85&auto=format",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=85&auto=format",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=85&auto=format",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=85&auto=format",
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=85&auto=format",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=85&auto=format",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=85&auto=format",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=85&auto=format",
];

function getPlaceholder(id: bigint) {
  return PLACEHOLDER_IMAGES[Number(id) % PLACEHOLDER_IMAGES.length];
}

// Category dot colors
const CAT_COLORS: Record<string, string> = {
  wedding:   "bg-rose-400",
  portrait:  "bg-violet-400",
  corporate: "bg-sky-400",
  event:     "bg-amber-400",
  other:     "bg-gray-400",
};

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export function PhotoCard({ photo, hasLicence, onPurchased }: PhotoCardProps) {
  const { isConnected } = useAccount();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isProcessing = isPending || isConfirming;
  const purchased = hasLicence || isSuccess;

  const img = !imgError && photo.imageUrl ? photo.imageUrl : getPlaceholder(photo.id);
  const title = photo.title || `Frame #${photo.id}`;
  const cat = photo.category ?? "other";
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
    onPurchased?.();
  }

  return (
    <article className="card-hover overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f0f0f0]">
        {!imgLoaded && <div className="absolute inset-0 skeleton" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(true); }}
        />

        {/* Price tag */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-lg bg-white/90 text-[#0a0a0a] text-sm font-bold shadow-sm">
            ${price}
          </span>
        </div>

        {/* Licensed */}
        {purchased && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold">
              Licensed ✓
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + category */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[#0a0a0a] font-semibold text-sm leading-snug line-clamp-1 flex-1">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 rounded-full ${CAT_COLORS[cat] ?? CAT_COLORS.other}`} />
            <span className="text-[#8a8a8a] text-xs capitalize">{cat}</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[#8a8a8a]">
          <span>{Number(photo.salesCount)} sold</span>
          {photo.location && (
            <>
              <span>·</span>
              <span className="truncate">{photo.location}</span>
            </>
          )}
        </div>

        <div className="h-px bg-[#e4e4e4] mt-auto" />

        {/* CTA */}
        {!isConnected ? (
          <button disabled className="w-full py-2 rounded-lg bg-[#f0f0f0] text-[#8a8a8a] text-sm font-medium cursor-not-allowed">
            Connect wallet
          </button>
        ) : purchased ? (
          <div className="w-full py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-semibold text-center">
            Licence Owned
          </div>
        ) : (
          <button
            onClick={handlePurchase}
            disabled={isProcessing}
            className="btn-primary w-full py-2 text-sm"
          >
            {isProcessing ? (
              <><Spinner /> {isPending ? "Confirm…" : "Confirming…"}</>
            ) : (
              `Buy — $${price} USDC`
            )}
          </button>
        )}

        {txHash && (
          <a
            href={`https://testnet.arcscan.app/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8a8a8a] hover:text-[#0a0a0a] text-xs text-center transition-colors"
          >
            View transaction ↗
          </a>
        )}
      </div>
    </article>
  );
}
