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

function timestamp(): string {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export function AgentPanel({ onPurchase }: AgentPanelProps) {
  const publicClient = usePublicClient();
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalSales: 0n,
    totalEarned: 0n,
    sessionDuration: 0n,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((type: AgentLog["type"], message: string, txHash?: string) => {
    setLogs((prev) => [
      ...prev.slice(-99),
      { id: logId++, timestamp: timestamp(), type, message, txHash },
    ]);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // Counter agent: polls session stats every 5s
  const pollStats = useCallback(async () => {
    if (!publicClient || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") return;
    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: EVENT_PROOF_ABI,
        functionName: "getSessionStats",
      });
      const [totalSales, totalEarned, sessionDuration] = result as [bigint, bigint, bigint];
      setSessionStats({ totalSales, totalEarned, sessionDuration });
    } catch {
      // silent
    }
  }, [publicClient]);

  // Buyer agent: simulate purchasing a random frame
  const runBuyerAgent = useCallback(async () => {
    if (!publicClient || CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      addLog("error", "Contract not deployed. Set NEXT_PUBLIC_CONTRACT_ADDRESS.");
      return;
    }

    addLog("buyer", "🤖 Buyer agent: fetching available frames…");

    try {
      const result = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: EVENT_PROOF_ABI,
        functionName: "getActivePhotos",
        args: [0n, 20n],
      });

      const [photos] = result as unknown as [readonly { id: bigint; price: bigint; active: boolean }[], bigint];
      const active = photos.filter((p) => p.active);

      if (active.length === 0) {
        addLog("buyer", "⚠ No active frames available. Skipping cycle.");
        return;
      }

      const target = active[Math.floor(Math.random() * active.length)];
      addLog(
        "buyer",
        `📸 Buyer agent selected Frame #${target.id} (price: $${formatUsdc(target.price)} USDC) — simulation cycle logged (real purchase requires wallet signature)`
      );

      // Counter agent reads stats after "purchase"
      await pollStats();
      addLog(
        "counter",
        `📊 Counter agent: session total = ${sessionStats.totalSales} sales · $${formatUsdc(sessionStats.totalEarned)} USDC earned`
      );
    } catch (err) {
      addLog("error", `Agent error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [publicClient, addLog, pollStats, sessionStats]);

  function startAgents() {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    addLog("info", "▶ Agent session started — buyer agent active, counter agent watching");
    pollStats();
    runBuyerAgent();
    intervalRef.current = setInterval(() => {
      runBuyerAgent();
      pollStats();
    }, 8000);
  }

  function stopAgents() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    addLog("info", "⏹ Agent session stopped");
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Live poll stats even when agents are not running
  useEffect(() => {
    pollStats();
    const id = setInterval(pollStats, 10000);
    return () => clearInterval(id);
  }, [pollStats]);

  const logTypeStyles: Record<AgentLog["type"], string> = {
    buyer:   "text-arc-300",
    counter: "text-emerald-400",
    info:    "text-white/50",
    error:   "text-red-400",
  };

  function formatDuration(seconds: bigint): string {
    const s = Number(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-arc-600/30 border border-arc-500/30 flex items-center justify-center text-arc-400">
              🤖
            </span>
            Agent Simulation
          </h2>
          <p className="text-white/40 text-sm mt-1">
            Buyer agent browses gallery · Counter agent tracks session earnings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <>
              <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Agents running
              </span>
              <button onClick={stopAgents} className="btn-danger text-sm">
                Stop
              </button>
            </>
          ) : (
            <button onClick={startAgents} className="btn-primary text-sm py-2">
              ▶ Run Agents
            </button>
          )}
        </div>
      </div>

      {/* Session stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <div className="text-2xl font-bold text-white">{Number(sessionStats.totalSales)}</div>
          <div className="text-white/40 text-xs mt-1">Total Sales</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <div className="text-2xl font-bold text-arc-300">
            ${formatUsdc(sessionStats.totalEarned)}
          </div>
          <div className="text-white/40 text-xs mt-1">USDC Earned</div>
        </div>
        <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
          <div className="text-2xl font-bold text-white/70">
            {sessionStats.sessionDuration > 0n ? formatDuration(sessionStats.sessionDuration) : "—"}
          </div>
          <div className="text-white/40 text-xs mt-1">Session Age</div>
        </div>
      </div>

      {/* Log terminal */}
      <div
        ref={logRef}
        className="bg-black/40 rounded-xl border border-white/10 p-4 h-52 overflow-y-auto font-mono text-xs space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-white/20 text-center mt-16">
            Press &ldquo;Run Agents&rdquo; to start simulation
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-2 leading-relaxed">
              <span className="text-white/20 flex-shrink-0 tabular-nums">{log.timestamp}</span>
              <span className={logTypeStyles[log.type]}>{log.message}</span>
              {log.txHash && (
                <a
                  href={`https://testnet.arcscan.app/tx/${log.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-arc-400 hover:underline flex-shrink-0"
                >
                  ↗ tx
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
