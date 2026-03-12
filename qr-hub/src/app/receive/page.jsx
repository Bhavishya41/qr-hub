"use client";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";

export default function Receive() {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [statusText, setStatusText] = useState("Point your camera at the sender's screen");

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setStatusText("Scanning… align the QR code in the viewfinder");
    } catch {
      setStatusText("Camera access denied — please allow camera permission");
    }
  };

  const flipCamera = () => {
    // Stop existing tracks then restart with the new facing mode
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    setCameraActive(false);
  };

  // Restart camera whenever facingMode changes (and camera was already active)
  useEffect(() => {
    if (cameraActive === false && facingMode) {
      // Only auto-restart if it was a flip (not initial load)
    }
  }, [facingMode]);

  return (
    <div className="min-h-screen bg-[var(--accent-secondary)] p-4 flex flex-col justify-center items-center relative">
      {/* Back button */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 brutal-btn bg-white text-black px-4 py-2 font-[family-name:var(--font-space-mono)] font-bold tracking-widest text-sm"
      >
        ← BACK
      </Link>

      {/* Camera controls top-right */}
      {cameraActive && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => setTorchOn((t) => !t)}
            title="Toggle torch"
            className={`brutal-btn w-11 h-11 flex items-center justify-center font-bold text-lg ${
              torchOn ? "bg-yellow-300 text-black" : "bg-white text-black"
            }`}
          >
            ⚡
          </button>
          <button
            onClick={flipCamera}
            title="Flip camera"
            className="brutal-btn w-11 h-11 bg-white text-black flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
              <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </div>
      )}

      <div className="brutal-card w-full max-w-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-black text-white font-[family-name:var(--font-bebas-neue)] text-3xl px-4 py-2 tracking-widest">
          RECEIVE A FILE
        </div>

        <div className="p-6 flex flex-col gap-5">

          {/* Viewfinder / Camera Area */}
          <div className="relative w-full aspect-square border-[3px] border-black bg-black overflow-hidden">
            {/* Camera feed */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Inactive overlay */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
                <div className="bg-white border-2 border-white/20 p-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <p className="font-[family-name:var(--font-space-mono)] text-white/60 text-sm text-center px-6">
                  TAP BELOW TO ACTIVATE CAMERA
                </p>
              </div>
            )}

            {/* Scanning corner brackets (shown when active) */}
            {cameraActive && (
              <>
                <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-[var(--bg)] z-20" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-[var(--bg)] z-20" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-[var(--bg)] z-20" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-[var(--bg)] z-20" />
                {/* Scan laser line */}
                <div className="absolute left-0 w-full h-[3px] bg-[var(--accent-primary)] shadow-[0_0_12px_var(--accent-primary)] animate-[scan_2.5s_ease-in-out_infinite] z-10" />
              </>
            )}
          </div>

          {/* Status message */}
          <p className="font-[family-name:var(--font-space-mono)] text-sm text-center opacity-70 tracking-wide">
            {statusText}
          </p>

          {/* Start / Stop camera button */}
          <button
            onClick={cameraActive ? () => {
              videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
              setCameraActive(false);
              setStatusText("Point your camera at the sender's screen");
            } : startCamera}
            className={`brutal-btn w-full py-4 font-[family-name:var(--font-archivo-black)] text-2xl tracking-widest ${
              cameraActive
                ? "bg-[var(--accent-secondary)] text-white"
                : "bg-[var(--accent-primary)] text-white"
            }`}
          >
            {cameraActive ? "⏹ STOP SCANNING" : "▶ START SCANNING"}
          </button>

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
