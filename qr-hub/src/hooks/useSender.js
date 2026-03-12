"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import QRCode from "qrcode";

// ─── Constants ────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 1536;          // payload bytes (smaller → safer QR capacity after latin-1)
const HEADER_SIZE = 7;            // FileID(2) + ChunkIndex(2) + TotalChunks(2) + Checksum(1)
const QR_CANVAS_SIZE = 300;
const TARGET_FPS = 12;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

// ─── Utility: build one chunk buffer ─────────────────────────────────────────
function buildChunk(fileId, chunkIndex, totalChunks, payload) {
  const buf = new Uint8Array(HEADER_SIZE + payload.length);
  const view = new DataView(buf.buffer);
  view.setUint16(0, fileId, false);        // big-endian
  view.setUint16(2, chunkIndex, false);
  view.setUint16(4, totalChunks, false);

  let checksum = 0;
  for (let i = 0; i < payload.length; i++) {
    buf[HEADER_SIZE + i] = payload[i];
    checksum ^= payload[i];
  }
  buf[6] = checksum & 0xff;
  return buf;
}

// ─── Convert Uint8Array → latin-1 string (safe for qrcode byte mode) ─────────
// This is the correct way to pass raw binary to the qrcode library in-browser.
// Each byte maps 1:1 to a char code, preserving full 8-bit fidelity.
function bytesToLatin1(bytes) {
  // Use chunked approach to avoid call stack overflow on large arrays
  const BATCH = 4096;
  let result = "";
  for (let i = 0; i < bytes.length; i += BATCH) {
    result += String.fromCharCode(...bytes.subarray(i, i + BATCH));
  }
  return result;
}

// ─── Render binary chunk → off-screen QR canvas ──────────────────────────────
async function renderQRToCanvas(chunkBytes) {
  const offscreen = document.createElement("canvas");
  offscreen.width = QR_CANVAS_SIZE;
  offscreen.height = QR_CANVAS_SIZE;

  const latin1String = bytesToLatin1(chunkBytes);

  await QRCode.toCanvas(offscreen, latin1String, {
    errorCorrectionLevel: "L",
    margin: 1,
    width: QR_CANVAS_SIZE,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return offscreen;
}

// ─── White blank canvas (for padding the last RGB frame) ─────────────────────
function createBlankCanvas() {
  const c = document.createElement("canvas");
  c.width = QR_CANVAS_SIZE;
  c.height = QR_CANVAS_SIZE;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, QR_CANVAS_SIZE, QR_CANVAS_SIZE);
  return c;
}

// ─── Merge 3 B&W QR canvases → one RGB canvas ────────────────────────────────
function mergeRGBChannels(qr1, qr2, qr3, output) {
  const w = QR_CANVAS_SIZE;
  const h = QR_CANVAS_SIZE;

  const d1 = qr1.getContext("2d").getImageData(0, 0, w, h).data;
  const d2 = qr2.getContext("2d").getImageData(0, 0, w, h).data;
  const d3 = qr3.getContext("2d").getImageData(0, 0, w, h).data;

  const outCtx = output.getContext("2d");
  const out = outCtx.createImageData(w, h);
  const od = out.data;

  for (let i = 0; i < w * h; i++) {
    const p = i * 4;
    od[p + 0] = d1[p] < 128 ? 0 : 255;   // R ← QR1
    od[p + 1] = d2[p] < 128 ? 0 : 255;   // G ← QR2
    od[p + 2] = d3[p] < 128 ? 0 : 255;   // B ← QR3
    od[p + 3] = 255;
  }

  outCtx.putImageData(out, 0, 0);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export default function useSender() {
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const frameIndexRef = useRef(0);
  // Flag: start streaming automatically once canvas mounts after encoding
  const pendingStartRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const [isEncoding, setIsEncoding] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // ── rAF render tick ──────────────────────────────────────────────────────────
  // Defined as a plain function ref so it has zero dependencies and never
  // gets recreated — avoiding stale-closure issues entirely.
  const renderFrameRef = useRef(null);
  renderFrameRef.current = (timestamp) => {
    const canvas = canvasRef.current;
    const frames = framesRef.current;

    if (!canvas || frames.length === 0) {
      // Canvas not yet mounted — retry next tick (handles React async commit)
      rafRef.current = requestAnimationFrame((ts) => renderFrameRef.current(ts));
      return;
    }

    if (timestamp - lastFrameTimeRef.current >= FRAME_INTERVAL_MS) {
      const idx = frameIndexRef.current;
      const [qr1, qr2, qr3] = frames[idx];

      if (canvas.width !== QR_CANVAS_SIZE) canvas.width = QR_CANVAS_SIZE;
      if (canvas.height !== QR_CANVAS_SIZE) canvas.height = QR_CANVAS_SIZE;

      mergeRGBChannels(qr1, qr2, qr3, canvas);

      const nextIdx = idx + 1;
      lastFrameTimeRef.current = timestamp;

      // Last frame shown — stop automatically
      if (nextIdx >= frames.length) {
        frameIndexRef.current = frames.length - 1; // stay on last frame
        setCurrentFrame(frames.length - 1);
        rafRef.current = null;
        setIsStreaming(false);
        setIsDone(true);
        return; // exit without scheduling next rAF
      }

      frameIndexRef.current = nextIdx;
      setCurrentFrame(nextIdx);
    }

    rafRef.current = requestAnimationFrame((ts) => renderFrameRef.current(ts));
  };

  // ── Start / Stop / Replay ──────────────────────────────────────────────────
  const start = useCallback(() => {
    if (rafRef.current != null) return; // already running
    lastFrameTimeRef.current = 0;
    setIsStreaming(true);
    rafRef.current = requestAnimationFrame((ts) => renderFrameRef.current(ts));
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const replay = useCallback(() => {
    // Reset to frame 0 and restart stream
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    frameIndexRef.current = 0;
    setCurrentFrame(0);
    setIsDone(false);
    lastFrameTimeRef.current = 0;
    setIsStreaming(true);
    rafRef.current = requestAnimationFrame((ts) => renderFrameRef.current(ts));
  }, []);

  // ── Effect: auto-start once canvas is committed to DOM ───────────────────────
  // This solves the race condition where start() was called before React had
  // mounted the <canvas> element (rendering it conditionally on isReady).
  useEffect(() => {
    if (pendingStartRef.current && canvasRef.current) {
      pendingStartRef.current = false;
      start();
    }
  });

  // ── Encode file ───────────────────────────────────────────────────────────────
  const encode = useCallback(async (file) => {
    // Reset streaming state
    stop();
    framesRef.current = [];
    frameIndexRef.current = 0;
    pendingStartRef.current = false;

    setIsEncoding(true);
    setProgress(0);
    setFrameCount(0);
    setCurrentFrame(0);

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const fileId = (Math.random() * 0xffff) | 0;

    // Split into raw payload chunks
    const payloads = [];
    for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
      payloads.push(bytes.slice(offset, offset + CHUNK_SIZE));
    }
    if (payloads.length === 0) payloads.push(new Uint8Array(0));

    const totalChunks = payloads.length;
    const chunks = payloads.map((payload, i) =>
      buildChunk(fileId, i, totalChunks, payload)
    );

    // Pad to multiple of 3
    const padCount = (3 - (chunks.length % 3)) % 3;
    const padChunk = buildChunk(fileId, 0xffff, totalChunks, new Uint8Array(0));
    for (let i = 0; i < padCount; i++) chunks.push(padChunk);

    const totalRGBFrames = chunks.length / 3;
    const rgbFrames = [];

    for (let f = 0; f < totalRGBFrames; f++) {
      const [qr1, qr2, qr3] = await Promise.all([
        renderQRToCanvas(chunks[f * 3 + 0]),
        renderQRToCanvas(chunks[f * 3 + 1]),
        renderQRToCanvas(chunks[f * 3 + 2]),
      ]);
      rgbFrames.push([qr1, qr2, qr3]);
      setProgress(Math.round(((f + 1) / totalRGBFrames) * 100));
      // Yield to browser each batch to keep UI responsive
      await new Promise((r) => setTimeout(r, 0));
    }

    framesRef.current = rgbFrames;
    setFrameCount(totalRGBFrames);
    setIsEncoding(false);
    setProgress(100);

    // Signal the useEffect to start the loop once the canvas element mounts
    pendingStartRef.current = true;
    // (setIsStreaming(true) will happen inside start(), called by the effect)
  }, [stop, start]);

  // ── Reset ─────────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    stop();
    framesRef.current = [];
    frameIndexRef.current = 0;
    pendingStartRef.current = false;
    setProgress(0);
    setFrameCount(0);
    setCurrentFrame(0);
    setIsEncoding(false);
    setIsDone(false);
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [stop]);

  return {
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
  };
}
