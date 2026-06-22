"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { EVENT_PROOF_ABI, CONTRACT_ADDRESS, formatUsdc } from "@/lib/contract";

interface AgentLog {
  id: number;
  timestamp: string;
  type: "buyer" | "counter" | "info" | "error";
  message: string;
  txHash?: string;
}

interface AgentPanelProps {
  onPurchase: () => void;
}

let logId = 0;
const ts = () => new Date().toLocaleTimeString("en-US", { hour12: false });

const LOG_COLOR: Record<AgentLog["type"], string> = {
  buyer:   "#d9b24f",
  counter: "#7fd1a0",
  info:    "#7d8c7e",
  error:   "#e08a82",
};

const LOG_PREFIX: Record<AgentLog["type"], string> = {
  buyer:   "BUYER",
  counter: "STATS",
  info:    "INFO ",
  error:   "ERROR",
};

function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export function AgentPanel({ onPurchase }: AgentPanelProps) {
  const publicClient = usePublicClient();
  const [logs, setLogs]       = useState<AgentLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats]     = useState({ totalSales: 0n, totalEarned: 0n, sessionDuration: 0n });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef      = useRef<HTMLDivElement>(null);

  const addLog = useCallback((type: AgentLog["type"], message: string, txHash?: string) => {
    setLogs((p) => [...p.slice(-99), { id: logId++, timestamp: ts(), type, message, txHash }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const pollStats = useCallback(async () => {
    if (!publicClient || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") return;
    try {
      const r = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: EVENT_PROOF_ABI, functionName: "getSessionStats" });
      const [totalSales, totalEarned, sessionDuration] = r as [bigint, bigint, bigint];
      setStats({ totalSales, totalEarned, sessionDuration });
    } catch { /* silent */ }
  }, [publicClient]);

  const runBuyerAgent = useCallback(async () => {
    if (!publicClient || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      addLog("error", "Contract not deployed. Set NEXT_PUBLIC_CONTRACT_ADDRESS."); return;
    }
    addLog("buyer", "Fetching available frames…");
    try {
      const r = await publicClient.readContract({ address: CONTRACT_ADDRESS, abi: EVENT_PROOF_ABI, functionName: "getActivePhotos", args: [0n, 20n] });
      const [photos] = r as unknown as [readonly { id: bigint; price: bigint; active: boolean }[], bigint];
      const active = photos.filter((p) => p.active);
      if (!active.length) { addLog("buyer", "No active frames — skipping."); return; }
      const t = active[Math.floor(Math.random() * active.length)];
      addLog("buyer", `Selected Frame #${t.id} @ $${formatUsdc(t.price)} USDC (simulation)`);
      await pollStats();
      addLog("counter", `Session: ${stats.totalSales} sales · $${formatUsdc(stats.totalEarned)} USDC earned`);
    } catch (e) {
      addLog("error", e instanceof Error ? e.message.slice(0, 120) : String(e));
    }
  }, [publicClient, addLog, pollStats, stats]);

  function startAgents() {
    if (isRunning) return;
    setIsRunning(true); setLogs([]);
    addLog("info", "Session started — buyer + counter agents running");
    pollStats(); runBuyerAgent();
    intervalRef.current = setInterval(() => { runBuyerAgent(); pollStats(); }, 8000);
  }

  function stopAgents() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    addLog("info", "Session stopped");
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);
  useEffect(() => { pollStats(); const id = setInterval(pollStats, 10000); return () => clearInterval(id); }, [pollStats]);

  function fmtDuration(s: bigint) {
    const n = Number(s);
    const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), sec = n % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="display text-[var(--text-1)] text-xl">Buyer &amp; Counter Agents</h2>
          <p className="text-[var(--text-3)] text-sm mt-0.5">
            Read-only client-side demo · Buyer reads on-chain gallery · Counter tracks session stats
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-[var(--success)] font-medium">
              <span className="w-2 h-2 rounded-full bg-[var(--success)]"/>
              Running
            </div>
          )}
          {isRunning ? (
            <button onClick={stopAgents} className="btn-danger py-1.5 px-4 text-sm">
              Stop
            </button>
          ) : (
            <button onClick={startAgents} className="btn-primary py-1.5 px-4 text-sm">
              ▶ Run Agents
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-b border-[var(--border)]">
        {[
          { label: "Total Sales",   value: Number(stats.totalSales).toString() },
          { label: "USDC Earned",   value: `$${formatUsdc(stats.totalEarned)}` },
          { label: "Session Age",   value: stats.sessionDuration > 0n ? fmtDuration(stats.sessionDuration) : "—" },
        ].map((s) => (
          <div key={s.label} className="px-6 py-5 text-center">
            <div className="display text-3xl text-[var(--gold)] tabular-nums">{s.value}</div>
            <div className="meta-text mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Terminal */}
      <div className="p-5">
        <div className="rounded-sm overflow-hidden border border-[var(--border-2)]">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-2)] border-b border-[var(--border-2)]">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--gold-deep)]"/>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-2)]"/>
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-2)]"/>
            </div>
            <span className="text-[var(--text-3)] text-xs font-mono ml-1">agent.log</span>
          </div>
          {/* Log body */}
          <div
            ref={logRef}
            className="h-48 overflow-y-auto p-4 bg-[#08110d] font-mono text-[11.5px] leading-relaxed space-y-0.5"
          >
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[var(--text-3)] text-xs">
                Press &ldquo;Run Agents&rdquo; to start_
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <span className="text-[var(--text-3)] tabular-nums flex-shrink-0 w-16">{log.timestamp}</span>
                  <span className="flex-shrink-0 w-12 font-semibold" style={{ color: LOG_COLOR[log.type] }}>
                    {LOG_PREFIX[log.type]}
                  </span>
                  <span style={{ color: LOG_COLOR[log.type] === "#7d8c7e" ? "#b9c4b3" : LOG_COLOR[log.type] }}>
                    {log.message}
                  </span>
                  {log.txHash && (
                    <a href={`https://testnet.arcscan.app/tx/${log.txHash}`} target="_blank" rel="noopener noreferrer"
                      className="text-[var(--gold)] hover:underline flex-shrink-0">↗</a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
