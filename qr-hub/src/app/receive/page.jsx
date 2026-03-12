"use client";
import { useEffect } from "react";
import Link from "next/link";
import useReceiver from "@/hooks/useReceiver";

const STATUS_LABELS = {
  idle:      { text: "READY TO RECEIVE",   color: "bg-white text-black" },
  scanning:  { text: "WAITING FOR SENDER", color: "bg-yellow-400 text-black animate-pulse" },
  receiving: { text: "RECEIVING DATA",     color: "bg-[var(--accent-primary)] text-white" },
  done:      { text: "✓ TRANSFER COMPLETE", color: "bg-[var(--success)] text-black" },
  error:     { text: "✗ CAMERA ERROR",     color: "bg-[var(--error)] text-white" },
};

export default function Receive() {
  const {
    videoRef,
    start,
    stop,
    flip,
    reset,
    status,
    receivedCount,
    receivedIndices,
    totalChunks,
    facingMode,
  } = useReceiver();

  const isActive  = status === "scanning" || status === "receiving";
  const isDone    = status === "done";
  const progress  = totalChunks > 0 ? Math.min(100, Math.round((receivedCount / totalChunks) * 100)) : 0;
  
  // Custom badge logic to distinguish between "Scanning for start" and "Actually receiving"
  const currentStatus = (status === "scanning" && totalChunks > 0) ? "receiving" : status;
  const badge = STATUS_LABELS[currentStatus] || STATUS_LABELS.idle;

  return (
    <div className="min-h-screen bg-[var(--accent-secondary)] p-4 flex flex-col justify-center items-center relative">

      {/* ── Back ──────────────────────────────────────────────────── */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 brutal-btn bg-white text-black px-4 py-2 font-[family-name:var(--font-space-mono)] font-bold tracking-widest text-sm"
      >
        ← BACK
      </Link>

      {/* ── Camera controls (top-right, visible when active) ──────────────── */}
      {isActive && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={flip}
            title="Flip camera"
            className="brutal-btn w-11 h-11 bg-white text-black flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
          </button>
        </div>
      )}

      <div className="brutal-card w-full max-w-[600px] flex flex-col">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="bg-black text-white font-[family-name:var(--font-bebas-neue)] text-3xl px-4 py-2 tracking-widest flex items-center justify-between">
          <span>RECEIVE A FILE</span>
          {totalChunks > 0 && (
            <span className="font-[family-name:var(--font-space-mono)] text-sm opacity-70">
              {receivedCount}/{totalChunks}
            </span>
          )}
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* ── Viewfinder ─────────────────────────────────────────── */}
          <div className="relative w-full aspect-square border-[3px] border-black bg-black overflow-hidden">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Inactive overlay */}
            {!isActive && !isDone && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
                <div className="bg-white border-2 border-white/20 p-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <p className="font-[family-name:var(--font-space-mono)] text-white/60 text-sm text-center px-6">
                  TAP BELOW TO ACTIVATE CAMERA
                </p>
              </div>
            )}

            {/* Done overlay */}
            {isDone && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
                <div className="bg-[var(--success)] border-[3px] border-white p-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p className="font-[family-name:var(--font-archivo-black)] text-white text-xl text-center tracking-widest">
                  FILE SAVED!
                </p>
              </div>
            )}

            {/* Corner brackets + laser (when scanning) */}
            {isActive && (
              <>
                <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-[var(--bg)] z-20"/>
                <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-[var(--bg)] z-20"/>
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-[var(--bg)] z-20"/>
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-[var(--bg)] z-20"/>
                <div className="absolute left-0 w-full h-[3px] bg-[var(--accent-primary)] shadow-[0_0_12px_var(--accent-primary)] z-10"
                     style={{ animation: "scan 2.5s ease-in-out infinite" }}/>
              </>
            )}
          </div>

          {/* ── Status badge ───────────────────────────────────────── */}
          <div className={`border-[3px] border-black py-2 px-4 text-center font-[family-name:var(--font-archivo-black)] tracking-widest text-sm ${badge.color}`}>
            {badge.text}
          </div>

          {/* ── Progress bar (appears after first chunk) ────────────── */}
          {totalChunks > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between font-[family-name:var(--font-space-mono)] text-xs">
                <span>CHUNKS RECEIVED</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-5 border-[3px] border-black bg-white overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Status grid — shows received chunk slots */}
              <div className="flex flex-wrap gap-[2px] mt-1">
                {Array.from({ length: Math.min(totalChunks, 80) }).map((_, i) => {
                  const received = receivedIndices ? receivedIndices.has(i) : i < receivedCount;
                  return (
                    <div
                      key={i}
                      className={`w-2 h-2 border border-black/30 ${
                        received ? "bg-[var(--accent-primary)]" : "bg-white/40"
                      }`}
                    />
                  );
                })}
                {totalChunks > 80 && (
                  <span className="font-[family-name:var(--font-space-mono)] text-[10px] text-black/60 self-center ml-1">
                    +{totalChunks - 80} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Action buttons ─────────────────────────────────────── */}
          {!isDone ? (
            <button
              onClick={isActive ? stop : start}
              className={`brutal-btn w-full py-4 font-[family-name:var(--font-archivo-black)] text-2xl tracking-widest ${
                isActive
                  ? "bg-[var(--accent-secondary)] text-white"
                  : "bg-[var(--accent-primary)] text-white"
              }`}
            >
              {isActive ? "⏹ STOP SCANNING" : "▶ START SCANNING"}
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="border-[3px] border-black bg-[var(--success)] py-4 px-6 flex items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="font-[family-name:var(--font-archivo-black)] text-xl tracking-widest">
                  DOWNLOAD STARTED
                </span>
              </div>
              <button
                onClick={reset}
                className="brutal-btn w-full py-2 bg-white text-black font-[family-name:var(--font-space-mono)] text-sm tracking-widest"
              >
                ← RECEIVE ANOTHER FILE
              </button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes scan {
          0%   { top: 0%; }
          50%  { top: calc(100% - 3px); }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
