"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { EVENT_PROOF_ABI, CONTRACT_ADDRESS, Photo, formatUsdc } from "@/lib/contract";

interface PhotoCardProps {
  photo: Photo;
  hasLicence: boolean;
  onPurchased?: () => void;
}

// Botanical placeholder palette — flat dark-green washes per frame.
// (No external image hotlinks; on-chain metadata images still render via photo.imageUrl.)
const PAD_TINTS = [
  ["#16271e", "#0d1b14"],
  ["#1b3327", "#102019"],
  ["#13231b", "#0a130e"],
  ["#244534", "#13241c"],
];
function getTint(id: bigint) {
  return PAD_TINTS[Number(id) % PAD_TINTS.length];
}

/** Flat illustrated lily-pad + flower placeholder for frames without a metadata image. */
function FramePlaceholder({ id }: { id: bigint }) {
  const [a, b] = getTint(id);
  return (
    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 35% 30%, ${a} 0%, ${b} 100%)` }}>
      <svg className="w-full h-full" viewBox="0 0 120 90" fill="none" preserveAspectRatio="xMidYMid slice">
        {/* lily pad */}
        <circle cx="42" cy="52" r="30" fill="var(--pad-3)" opacity="0.55" />
        {Array.from({ length: 9 }).map((_, i) => {
          const ang = (i / 9) * Math.PI * 2;
          return <line key={i} x1="42" y1="52" x2={42 + Math.cos(ang) * 28} y2={52 + Math.sin(ang) * 28} stroke="var(--pad-deep)" strokeWidth="0.8" opacity="0.5" />;
        })}
        {/* flower */}
        <g transform="translate(82 34)">
          {Array.from({ length: 5 }).map((_, i) => (
            <ellipse key={i} cx="0" cy="-8" rx="3.4" ry="7" fill="#f1ead8" opacity="0.9" transform={`rotate(${i * 72})`} />
          ))}
          <circle r="3" fill="var(--gold)" />
        </g>
      </svg>
    </div>
  );
}

// Category dot colors — gold/sage nocturne palette
const CAT_COLORS: Record<string, string> = {
  wedding:   "bg-[#d9b24f]",
  portrait:  "bg-[#b9c4b3]",
  corporate: "bg-[#7fd1a0]",
  event:     "bg-[#c9a44c]",
  other:     "bg-[#7d8c7e]",
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

  const hasImage = !imgError && !!photo.imageUrl;
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
    <article className="card-hover overflow-hidden flex flex-col group">
      {/* Image / botanical placeholder */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-1)]">
        {hasImage ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            {/* Real on-chain metadata image (slot). Falls back to FramePlaceholder on error. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.imageUrl}
              alt={title}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => { setImgError(true); setImgLoaded(true); }}
            />
          </>
        ) : (
          <div className="w-full h-full transition-transform duration-700 group-hover:scale-105">
            <FramePlaceholder id={photo.id} />
          </div>
        )}

        {/* gradient veil for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1310]/70 via-transparent to-transparent pointer-events-none" />

        {/* Price tag */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-sm bg-[#0a1310]/85 border border-[var(--border-2)] text-[var(--gold)] text-sm font-semibold tabular-nums backdrop-blur-sm">
            ${price}
          </span>
        </div>

        {/* Licensed */}
        {purchased && (
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-sm bg-[var(--success-bg)] border border-[rgba(127,209,160,0.4)] text-[var(--success)] text-xs font-semibold backdrop-blur-sm">
              Licensed ✦
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + category */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="display text-[var(--text-1)] text-lg leading-snug line-clamp-1 flex-1">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
            <span className={`w-2 h-2 rounded-full ${CAT_COLORS[cat] ?? CAT_COLORS.other}`} />
            <span className="meta-text">{cat}</span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-3)]">
          <span>{Number(photo.salesCount)} sold</span>
          {photo.location && (
            <>
              <span>·</span>
              <span className="truncate">{photo.location}</span>
            </>
          )}
        </div>

        <div className="h-px bg-[var(--border)] mt-auto" />

        {/* CTA */}
        {!isConnected ? (
          <button disabled className="w-full py-2 rounded-sm bg-[var(--bg-2)] border border-[var(--border)] text-[var(--text-3)] text-sm font-medium cursor-not-allowed">
            Connect wallet
          </button>
        ) : purchased ? (
          <div className="w-full py-2 rounded-sm bg-[var(--success-bg)] border border-[rgba(127,209,160,0.35)] text-[var(--success)] text-sm font-semibold text-center">
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
            className="text-[var(--text-3)] hover:text-[var(--gold)] text-xs text-center transition-colors"
          >
            View transaction ↗
          </a>
        )}
      </div>
    </article>
  );
}
