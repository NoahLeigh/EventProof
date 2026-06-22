"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Navbar } from "@/components/Navbar";
import { EVENT_PROOF_ABI, CONTRACT_ADDRESS, usdcToWei } from "@/lib/contract";
import { keccak256, toBytes } from "viem";

function sha256ToBytes32(hash: string): `0x${string}` {
  // Expects a hex string without 0x or a plain hex
  const hex = hash.replace(/^0x/, "").padStart(64, "0");
  return `0x${hex}` as `0x${string}`;
}

export default function ListPhotoPage() {
  const { address, isConnected } = useAccount();

  const [form, setForm] = useState({
    metadataUri: "",
    fileHash: "",
    price: "0.10",
    title: "",
    description: "",
  });

  const [hashMode, setHashMode] = useState<"manual" | "generate">("generate");
  const [generatedHash, setGeneratedHash] = useState("");

  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: EVENT_PROOF_ABI,
    functionName: "owner",
  });

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isOwner =
    contractOwner &&
    address &&
    (contractOwner as string).toLowerCase() === address.toLowerCase();

  function generateHash() {
    const input = `${form.title}:${form.description}:${Date.now()}`;
    const hash = keccak256(toBytes(input));
    setGeneratedHash(hash);
    setForm((f) => ({ ...f, fileHash: hash }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const uri = form.metadataUri.trim();
    const rawHash = hashMode === "generate" ? generatedHash : form.fileHash.trim();
    const priceNum = parseFloat(form.price);

    if (!uri || !rawHash || isNaN(priceNum) || priceNum <= 0) return;

    const fileHashBytes32 = sha256ToBytes32(rawHash.replace(/^0x/, ""));
    const priceWei = usdcToWei(priceNum);

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: EVENT_PROOF_ABI,
      functionName: "listPhoto",
      args: [uri, fileHashBytes32, priceWei],
    });
  }

  const PRICE_PRESETS = [0.10, 0.15, 0.20, 0.25, 0.30];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">List a Frame</h1>
          <p className="text-white/50 mt-1">
            Add a photo to the gallery. Only the contract owner (photographer) can list frames.
          </p>
        </div>

        {!isConnected ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-arc-600/20 border border-arc-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-arc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Connect your wallet</h3>
            <p className="text-white/40 text-sm">Only the photographer who deployed the contract can list frames.</p>
          </div>
        ) : !isOwner ? (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Not authorized</h3>
            <p className="text-white/40 text-sm">
              Only the contract owner can list photos. Connect with the photographer&apos;s wallet.
            </p>
          </div>
        ) : isSuccess ? (
          <div className="card p-8 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Frame listed!</h3>
            <p className="text-white/50 text-sm mb-6">Your photo is now available for purchase.</p>
            {txHash && (
              <a
                href={`https://testnet.arcscan.app/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm inline-flex items-center gap-2"
              >
                View on ArcScan ↗
              </a>
            )}
            <div className="mt-4">
              <button
                onClick={() => setForm({ metadataUri: "", fileHash: "", price: "0.10", title: "", description: "" })}
                className="text-arc-400 text-sm hover:underline"
              >
                List another frame
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Frame Title</label>
              <input
                type="text"
                placeholder="e.g. Wedding Ceremony — Golden Hour"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="input-field"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Description</label>
              <textarea
                placeholder="Brief description of this frame…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="input-field resize-none"
              />
            </div>

            {/* Metadata URI */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Metadata URI
                <span className="ml-2 text-white/30 text-xs font-normal">IPFS JSON with name, image, attributes</span>
              </label>
              <input
                type="text"
                placeholder="ipfs://Qm... or https://..."
                value={form.metadataUri}
                onChange={(e) => setForm((f) => ({ ...f, metadataUri: e.target.value }))}
                required
                className="input-field font-mono text-sm"
              />
            </div>

            {/* File Hash */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                File Hash (SHA-256)
                <span className="ml-2 text-white/30 text-xs font-normal">cryptographic proof of the original file</span>
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setHashMode("generate")}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${hashMode === "generate" ? "bg-arc-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                >
                  Auto-generate
                </button>
                <button
                  type="button"
                  onClick={() => setHashMode("manual")}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${hashMode === "manual" ? "bg-arc-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                >
                  Enter manually
                </button>
              </div>

              {hashMode === "generate" ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedHash}
                    readOnly
                    placeholder="Click 'Generate' to create hash"
                    className="input-field font-mono text-xs text-white/50 flex-1"
                  />
                  <button
                    type="button"
                    onClick={generateHash}
                    className="btn-secondary text-sm py-2 px-4 whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="0x... (32-byte hex)"
                  value={form.fileHash}
                  onChange={(e) => setForm((f) => ({ ...f, fileHash: e.target.value }))}
                  required
                  className="input-field font-mono text-sm"
                />
              )}
            </div>

            {/* Price */}
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">
                Price (USDC)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRICE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, price: p.toFixed(2) }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      form.price === p.toFixed(2)
                        ? "bg-arc-600 text-white"
                        : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    ${p.toFixed(2)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="input-field"
              />
            </div>

            {/* Error */}
            {writeError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {writeError.message.slice(0, 200)}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isPending || isConfirming ? (
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  List Frame on ARC
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
