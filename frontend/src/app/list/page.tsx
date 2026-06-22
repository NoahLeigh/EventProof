"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Navbar } from "@/components/Navbar";
import { EVENT_PROOF_ABI, CONTRACT_ADDRESS, usdcToWei } from "@/lib/contract";
import { keccak256, toBytes } from "viem";

function sha256ToBytes32(hash: string): `0x${string}` {
  const hex = hash.replace(/^0x/, "").padStart(64, "0");
  return `0x${hex}` as `0x${string}`;
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <label className="text-[var(--text-1)] text-sm font-semibold">{label}</label>
        {hint && <span className="text-[var(--text-3)] text-xs">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const PRESETS = [0.10, 0.15, 0.25, 0.50, 1.00];

export default function ListPhotoPage() {
  const { address, isConnected } = useAccount();
  const [form, setForm] = useState({ metadataUri: "", fileHash: "", price: "0.10", title: "", description: "" });
  const [hashMode, setHashMode] = useState<"generate" | "manual">("generate");
  const [generatedHash, setGeneratedHash] = useState("");

  const { data: contractOwner } = useReadContract({ address: CONTRACT_ADDRESS, abi: EVENT_PROOF_ABI, functionName: "owner" });
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isOwner = contractOwner && address && (contractOwner as string).toLowerCase() === address.toLowerCase();

  function generateHash() {
    const h = keccak256(toBytes(`${form.title}:${form.description}:${Date.now()}`));
    setGeneratedHash(h);
    setForm((f) => ({ ...f, fileHash: h }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uri = form.metadataUri.trim();
    const rawHash = hashMode === "generate" ? generatedHash : form.fileHash.trim();
    const priceNum = parseFloat(form.price);
    if (!uri || !rawHash || isNaN(priceNum) || priceNum <= 0) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_PROOF_ABI,
      functionName: "listPhoto",
      args: [uri, sha256ToBytes32(rawHash.replace(/^0x/, "")), usdcToWei(priceNum)],
    });
  }

  // Gate: not connected
  if (!isConnected) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-5 pt-44 pb-16">
        <div className="card p-10 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--bg-2)] border border-[var(--border-2)] flex items-center justify-center text-[var(--text-3)]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div>
            <h3 className="display text-[var(--text-1)] text-xl mb-1">Connect your wallet</h3>
            <p className="text-[var(--text-3)] text-sm">Only the contract photographer can list frames.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Gate: not owner
  if (!isOwner) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-5 pt-44 pb-16">
        <div className="card p-10 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--danger-bg)] border border-[rgba(224,138,130,0.35)] flex items-center justify-center text-[var(--danger)]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <div>
            <h3 className="display text-[var(--text-1)] text-xl mb-1">Not authorised</h3>
            <p className="text-[var(--text-3)] text-sm">Only the contract owner can list photos.</p>
          </div>
          <div className="font-mono text-xs text-[var(--text-3)] bg-[var(--bg-2)] border border-[var(--border)] px-3 py-1.5 rounded-sm">
            Owner: {contractOwner ? `${(contractOwner as string).slice(0, 10)}…${(contractOwner as string).slice(-6)}` : "—"}
          </div>
        </div>
      </div>
    </div>
  );

  // Success
  if (isSuccess) return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-lg mx-auto px-5 pt-44 pb-16">
        <div className="card p-10 flex flex-col items-center text-center gap-5 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-[var(--success-bg)] border border-[rgba(127,209,160,0.35)] flex items-center justify-center text-[var(--success)]">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div>
            <h3 className="display text-[var(--text-1)] text-2xl mb-1">Frame listed!</h3>
            <p className="text-[var(--text-3)] text-sm">Your photo is now available for purchase.</p>
          </div>
          {txHash && (
            <a href={`https://testnet.arcscan.app/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">
              View on ArcScan ↗
            </a>
          )}
          <div className="h-px w-full bg-[var(--border)]"/>
          <button
            onClick={() => setForm({ metadataUri: "", fileHash: "", price: "0.10", title: "", description: "" })}
            className="btn-ghost text-sm text-[var(--gold)]"
          >
            + List another frame
          </button>
        </div>
      </div>
    </div>
  );

  // Form
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 sm:px-8 pt-32 sm:pt-36 pb-20">

        <div className="py-10 border-b border-[var(--border)] mb-10">
          <p className="section-label mb-2">Photographer Panel</p>
          <h1 className="display text-[clamp(2.4rem,6vw,4rem)] text-[var(--text-1)]">
            List a <span className="gold-text italic">Frame</span>
          </h1>
          <p className="text-[var(--text-2)] text-base mt-3 font-light">
            Add a photo to the on-chain album. Buyers receive an NFT proof of purchase.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">

          <Field label="Frame Title" hint="optional">
            <input type="text" placeholder="e.g. Wedding Ceremony — Golden Hour" value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field"/>
          </Field>

          <Field label="Description" hint="optional">
            <textarea placeholder="A brief description…" value={form.description} rows={2}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field resize-none"/>
          </Field>

          <div className="h-px bg-[var(--border)]"/>

          <Field label="Metadata URI" hint="IPFS JSON with name, image, attributes — required">
            <input type="text" placeholder="ipfs://Qm... or https://..." value={form.metadataUri} required
              onChange={(e) => setForm((f) => ({ ...f, metadataUri: e.target.value }))} className="input-field font-mono text-sm"/>
          </Field>

          <Field label="File Hash" hint="SHA-256 / keccak256 — required">
            <div className="flex gap-1 p-1 rounded-sm border border-[var(--border-2)] bg-[var(--bg-1)] w-fit mb-3">
              {(["generate", "manual"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setHashMode(m)}
                  className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-colors capitalize ${hashMode === m ? "bg-[var(--gold-bg)] border border-[rgba(217,178,79,0.4)] text-[var(--gold)]" : "text-[var(--text-3)] hover:text-[var(--gold)]"}`}>
                  {m === "generate" ? "Auto-generate" : "Manual"}
                </button>
              ))}
            </div>
            {hashMode === "generate" ? (
              <div className="flex gap-2">
                <input type="text" value={generatedHash} readOnly placeholder="Click Generate…"
                  className="input-field font-mono text-xs text-[var(--text-3)] flex-1"/>
                <button type="button" onClick={generateHash} className="btn-secondary text-sm py-2.5 px-4 flex-shrink-0">
                  ↺ Generate
                </button>
              </div>
            ) : (
              <input type="text" placeholder="0x… (32-byte hex)" value={form.fileHash} required
                onChange={(e) => setForm((f) => ({ ...f, fileHash: e.target.value }))} className="input-field font-mono text-sm"/>
            )}
          </Field>

          <div className="h-px bg-[var(--border)]"/>

          <Field label="Licence Price (USDC)">
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map((p) => (
                <button key={p} type="button" onClick={() => setForm((f) => ({ ...f, price: p.toFixed(2) }))}
                  className={`px-4 py-2 rounded-sm text-sm font-semibold border transition-all ${form.price === p.toFixed(2) ? "bg-[var(--gold-bg)] border-[rgba(217,178,79,0.5)] text-[var(--gold)]" : "bg-[var(--bg-1)] border-[var(--border-2)] text-[var(--text-2)] hover:border-[var(--gold-soft)]"}`}>
                  ${p.toFixed(2)}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-sm">$</span>
              <input type="number" step="0.01" min="0.01" max="100" value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="input-field pl-7 pr-16"/>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] text-xs font-medium">USDC</span>
            </div>
          </Field>

          {writeError && (
            <div className="flex gap-3 items-start bg-[var(--danger-bg)] border border-[rgba(224,138,130,0.35)] rounded-sm px-4 py-3">
              <svg className="w-4 h-4 text-[var(--danger)] flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
              <p className="text-[var(--danger)] text-sm">{writeError.message.slice(0, 200)}</p>
            </div>
          )}

          <button type="submit" disabled={isPending || isConfirming} className="btn-primary w-full py-3.5 text-base font-bold">
            {isPending || isConfirming
              ? <><Spinner/> {isPending ? "Confirm in wallet…" : "Confirming…"}</>
              : "List Frame on ARC Blockchain"
            }
          </button>

          <p className="text-[var(--text-3)] text-xs text-center">
            Calls <code className="bg-[var(--bg-2)] px-1 py-0.5 rounded text-[var(--gold)]">listPhoto()</code> on the contract.
            File hash and metadata URI stored permanently on-chain.
          </p>
        </form>
      </div>
    </div>
  );
}
