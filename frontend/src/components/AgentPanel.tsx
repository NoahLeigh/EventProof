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
  buyer:   "#1a1aff",
  counter: "#16a34a",
  info:    "#8a8a8a",
  error:   "#dc2626",
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
      <div className="px-6 py-5 border-b border-[#e4e4e4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[#0a0a0a] font-bold text-base">Agent Simulation</h2>
          <p className="text-[#8a8a8a] text-sm mt-0.5">
            Buyer agent reads on-chain gallery · Counter agent tracks session stats
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500"/>
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
      <div className="grid grid-cols-3 divide-x divide-[#e4e4e4] border-b border-[#e4e4e4]">
        {[
          { label: "Total Sales",   value: Number(stats.totalSales).toString() },
          { label: "USDC Earned",   value: `$${formatUsdc(stats.totalEarned)}` },
          { label: "Session Age",   value: stats.sessionDuration > 0n ? fmtDuration(stats.sessionDuration) : "—" },
        ].map((s) => (
          <div key={s.label} className="px-6 py-4 text-center">
            <div className="text-2xl font-bold text-[#0a0a0a] tabular-nums">{s.value}</div>
            <div className="text-xs text-[#8a8a8a] mt-1 uppercase tracking-wide font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Terminal */}
      <div className="p-5">
        <div className="rounded-xl overflow-hidden border border-[#e4e4e4]">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f7f7f7] border-b border-[#e4e4e4]">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e4e4e4]"/>
              <span className="w-2.5 h-2.5 rounded-full bg-[#e4e4e4]"/>
              <span className="w-2.5 h-2.5 rounded-full bg-[#e4e4e4]"/>
            </div>
            <span className="text-[#8a8a8a] text-xs font-mono ml-1">agent.log</span>
          </div>
          {/* Log body */}
          <div
            ref={logRef}
            className="h-48 overflow-y-auto p-4 bg-white font-mono text-[11.5px] leading-relaxed space-y-0.5"
          >
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#c4c4c4] text-xs">
                Press &ldquo;Run Agents&rdquo; to start_
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3">
                  <span className="text-[#c4c4c4] tabular-nums flex-shrink-0 w-16">{log.timestamp}</span>
                  <span className="flex-shrink-0 w-12 font-semibold" style={{ color: LOG_COLOR[log.type] }}>
                    {LOG_PREFIX[log.type]}
                  </span>
                  <span style={{ color: LOG_COLOR[log.type] === "#8a8a8a" ? "#6a6a6a" : LOG_COLOR[log.type] }}>
                    {log.message}
                  </span>
                  {log.txHash && (
                    <a href={`https://testnet.arcscan.app/tx/${log.txHash}`} target="_blank" rel="noopener noreferrer"
                      className="text-[#1a1aff] hover:underline flex-shrink-0">↗</a>
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
