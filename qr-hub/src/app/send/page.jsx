"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import useSender from "@/hooks/useSender";

export default function Send() {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const {
    canvasRef,
    encode,
    start,
    stop,
    replay,
    reset,
    progress,
    isEncoding,
    isStreaming,
    isDone,
    frameCount,
    currentFrame,
  } = useSender();

  const isReady = frameCount > 0 && !isEncoding;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      reset();
      setFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (!isEncoding && !isStreaming) fileInputRef.current?.click();
  };

  const handleGenerate = async () => {
    if (!file || isEncoding) return;
    await encode(file);
    start();
  };

  const handleToggleStream = () => {
    if (isStreaming) stop();
    else start();
  };

  const handleReset = () => {
    reset();
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 flex flex-col justify-center items-center relative">
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 brutal-btn bg-white text-black px-4 py-2 font-[family-name:var(--font-space-mono)] font-bold tracking-widest text-sm"
      >
        ← BACK
      </Link>

      <div className="brutal-card w-full max-w-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-black text-white font-[family-name:var(--font-bebas-neue)] text-3xl px-4 py-2 tracking-widest flex items-center justify-between">
          <span>SEND A FILE</span>
          {isReady && (
            <span className="font-[family-name:var(--font-space-mono)] text-sm opacity-70">
              {frameCount} FRAMES
            </span>
          )}
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* ── File Picker (hidden once streaming) ───────────────── */}
          {!isReady && (
            <div
              onClick={handleUploadClick}
              className={`border-[3px] border-dashed border-black p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-colors group ${
                isEncoding ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="bg-[var(--success)] border-2 border-black p-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <span className="font-[family-name:var(--font-archivo-black)] text-lg text-center break-all">
                    {file.name}
                  </span>
                  <span className="font-[family-name:var(--font-space-mono)] text-sm opacity-60">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white border-2 border-black p-4 group-hover:-translate-y-1 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="font-[family-name:var(--font-archivo-black)] text-xl">CLICK TO CHOOSE FILE</p>
                    <p className="font-[family-name:var(--font-space-mono)] text-sm mt-1 opacity-60 italic">ANY FORMAT, UP TO 10 MB</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Progress Bar (during encoding) ────────────────────── */}
          {isEncoding && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between font-[family-name:var(--font-space-mono)] text-sm">
                <span>ENCODING FRAMES…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-5 border-[3px] border-black bg-white overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* ── RGB QR Canvas ─────────────────────────────────────── */}
          {(isEncoding || isReady) && (
            <div className="flex flex-col items-center gap-3">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="border-[3px] border-black w-full max-w-[300px]"
                style={{ imageRendering: "pixelated" }}
              />
              {isReady && (
                <p className="font-[family-name:var(--font-space-mono)] text-xs opacity-60 tracking-wide">
                  FRAME {currentFrame + 1} / {frameCount} · LOOPING
                </p>
              )}
            </div>
          )}

          {/* ── Action Buttons ────────────────────────────────────── */}
          <div className="flex flex-col gap-3">
            {/* Generate / Start button (pre-stream phase) */}
            {!isReady && (
              <button
                onClick={handleGenerate}
                disabled={!file || isEncoding}
                className={`brutal-btn w-full py-4 font-[family-name:var(--font-archivo-black)] text-2xl tracking-widest transition-all ${
                  file && !isEncoding
                    ? "bg-[var(--accent-primary)] text-white"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50 shadow-none"
                }`}
              >
                {isEncoding ? `ENCODING… ${progress}%` : "GENERATE QR CODE"}
              </button>
            )}

            {/* Done / Stop / Resume controls (post-encode phase) */}
            {isReady && (
              <>
                {isDone ? (
                  <div className="flex flex-col gap-3">
                    <div className="border-[3px] border-black bg-[var(--success)] py-4 px-6 flex items-center justify-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="font-[family-name:var(--font-archivo-black)] text-xl tracking-widest">
                        ALL FRAMES SENT
                      </span>
                    </div>
                    <button
                      onClick={replay}
                      className="brutal-btn w-full py-3 bg-[var(--accent-primary)] text-white font-[family-name:var(--font-archivo-black)] text-xl tracking-widest"
                    >
                      ↺ PLAY AGAIN
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleToggleStream}
                    className={`brutal-btn w-full py-4 font-[family-name:var(--font-archivo-black)] text-2xl tracking-widest transition-all ${
                      isStreaming
                        ? "bg-[var(--accent-secondary)] text-white"
                        : "bg-[var(--accent-primary)] text-white"
                    }`}
                  >
                    {isStreaming ? "⏹ STOP SENDING" : "▶ RESUME SENDING"}
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="brutal-btn w-full py-2 bg-white text-black font-[family-name:var(--font-space-mono)] text-sm tracking-widest"
                >
                  ← SEND ANOTHER FILE
                </button>
              </>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
