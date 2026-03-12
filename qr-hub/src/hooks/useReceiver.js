"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { openDB } from "idb";
import jsQR from "jsqr";

// ─── Constants ────────────────────────────────────────────────────────────────
const DB_NAME = "zero-wire-db";
const DB_VERSION = 1;
const STORE = "transfers";
const PROCESS_SIZE = 300;   // downscale video frame to 300×300 for QR scanning
const HEADER_SIZE = 7;      // FileID(2) + ChunkIndex(2) + TotalChunks(2) + Checksum(1)
const PAD_CHUNK_INDEX = 0xffff;

// ─── DB helper ────────────────────────────────────────────────────────────────
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("fileId", "fileId");
      }
    },
  });
}

// ─── latin-1 string → Uint8Array (mirror of sender's bytesToLatin1) ───────────
function latin1ToBytes(str) {
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i) & 0xff;
  return buf;
}

// ─── Parse 7-byte header from decoded QR data string ─────────────────────────
function parseHeader(dataStr) {
  const bytes = latin1ToBytes(dataStr);
  if (bytes.length < HEADER_SIZE) return null;

  const view = new DataView(bytes.buffer);
  const fileId      = view.getUint16(0, false);
  const chunkIndex  = view.getUint16(2, false);
  const totalChunks = view.getUint16(4, false);
  const checksum    = bytes[6];

  // XOR checksum verification
  let xor = 0;
  for (let i = HEADER_SIZE; i < bytes.length; i++) xor ^= bytes[i];
  if (xor !== checksum) return null;

  return {
    fileId,
    chunkIndex,
    totalChunks,
    payload: bytes.slice(HEADER_SIZE),
  };
}

// ─── Single-pass pixel demux: compute adaptive threshold + 3 B&W masks ────────
// Returns { r, g, b } each as a Uint8ClampedArray of length W*H*4 (RGBA)
// suitable for jsQR.
function demuxFrame(rgba, w, h) {
  const total = w * h;

  // Pass 1: compute mean luminance (ITU-R BT.601 luma coefficients)
  let lumSum = 0;
  for (let i = 0; i < total; i++) {
    const p = i * 4;
    lumSum += 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
  }
  const threshold = lumSum / total;

  // Pass 2: build 3 separate grayscale ImageData arrays
  const r = new Uint8ClampedArray(total * 4);
  const g = new Uint8ClampedArray(total * 4);
  const b = new Uint8ClampedArray(total * 4);

  for (let i = 0; i < total; i++) {
    const p = i * 4;
    const rv = rgba[p]     < threshold ? 0 : 255;
    const gv = rgba[p + 1] < threshold ? 0 : 255;
    const bv = rgba[p + 2] < threshold ? 0 : 255;

    // Write as grayscale RGBA (jsQR expects R=G=B for best results)
    r[p] = r[p+1] = r[p+2] = rv; r[p+3] = 255;
    g[p] = g[p+1] = g[p+2] = gv; g[p+3] = 255;
    b[p] = b[p+1] = b[p+2] = bv; b[p+3] = 255;
  }

  return { r, g, b };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export default function useReceiver() {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);  // hidden processing canvas
  const rafRef      = useRef(null);
  const streamRef   = useRef(null);
  const dbRef       = useRef(null);
  // Track which chunk IDs we've seen in this session to avoid redundant DB writes
  const seenRef     = useRef(new Set());
  // Current transfer state
  const activeFileRef = useRef(null); // { fileId, totalChunks }

  const [status, setStatus]         = useState("idle"); // idle|scanning|receiving|done|error
  const [receivedCount, setReceived] = useState(0);
  const [totalChunks, setTotal]     = useState(0);
  const [facingMode, setFacingMode] = useState("environment");

  // ── Open DB once on mount ─────────────────────────────────────────────────
  useEffect(() => {
    getDB().then((db) => (dbRef.current = db));
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Trigger auto-download when done ──────────────────────────────────────
  const downloadFile = useCallback(async (fileId) => {
    const db = dbRef.current;
    if (!db) return;
    const all = await db.getAllFromIndex(STORE, "fileId", fileId);
    all.sort((a, b) => a.chunkIndex - b.chunkIndex);
    const blob = new Blob(all.map((c) => c.payload));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zero-wire-file";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, []);

  // ── Per-frame processing ──────────────────────────────────────────────────
  const processFrameRef = useRef(null);
  processFrameRef.current = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const db = dbRef.current;
    if (!video || !canvas || !db || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => processFrameRef.current());
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, PROCESS_SIZE, PROCESS_SIZE);
    const { data } = ctx.getImageData(0, 0, PROCESS_SIZE, PROCESS_SIZE);

    // Demux using adaptive threshold
    const { r, g, b } = demuxFrame(data, PROCESS_SIZE, PROCESS_SIZE);

    // Decode all 3 channels
    const decodes = [
      jsQR(r, PROCESS_SIZE, PROCESS_SIZE, { inversionAttempts: "dontInvert" }),
      jsQR(g, PROCESS_SIZE, PROCESS_SIZE, { inversionAttempts: "dontInvert" }),
      jsQR(b, PROCESS_SIZE, PROCESS_SIZE, { inversionAttempts: "dontInvert" }),
    ];

    for (const qr of decodes) {
      if (!qr?.data) continue;
      const header = parseHeader(qr.data);
      if (!header) continue;
      const { fileId, chunkIndex, totalChunks, payload } = header;
      if (chunkIndex === PAD_CHUNK_INDEX) continue; // padding frame — skip

      const key = `${fileId}-${chunkIndex}`;
      if (seenRef.current.has(key)) continue; // duplicate in this session
      seenRef.current.add(key);

      // New file started? reset
      if (!activeFileRef.current || activeFileRef.current.fileId !== fileId) {
        seenRef.current = new Set([key]);
        activeFileRef.current = { fileId, totalChunks };
        setTotal(totalChunks);
        setReceived(0);
      }

      try {
        await db.put(STORE, { id: key, fileId, chunkIndex, totalChunks, payload });
      } catch { /* duplicate put is fine */ }

      const count = await db.countFromIndex(STORE, "fileId", fileId);
      setReceived(count);
      setStatus("receiving");

      if (count >= totalChunks) {
        // Stop scanning
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setStatus("done");
        await downloadFile(fileId, totalChunks);
        return;
      }
    }

    rafRef.current = requestAnimationFrame(() => processFrameRef.current());
  };

  // ── Start camera + rAF loop ───────────────────────────────────────────────
  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Ensure hidden canvas exists
      if (!canvasRef.current) {
        const c = document.createElement("canvas");
        c.width = PROCESS_SIZE;
        c.height = PROCESS_SIZE;
        canvasRef.current = c;
      }

      setStatus("scanning");
      rafRef.current = requestAnimationFrame(() => processFrameRef.current());
    } catch (e) {
      setStatus("error");
    }
  }, [facingMode]);

  // ── Stop ─────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  // ── Flip camera ───────────────────────────────────────────────────────────
  const flip = useCallback(async () => {
    stop();
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
  }, [stop, facingMode]);

  // ── Auto-restart after flip ───────────────────────────────────────────────
  const prevFacingRef = useRef(facingMode);
  useEffect(() => {
    if (prevFacingRef.current !== facingMode) {
      prevFacingRef.current = facingMode;
      // Only restart if we were previously scanning/receiving
    }
  }, [facingMode]);

  // ── Reset for a new transfer ──────────────────────────────────────────────
  const reset = useCallback(() => {
    stop();
    seenRef.current = new Set();
    activeFileRef.current = null;
    setReceived(0);
    setTotal(0);
    setStatus("idle");
  }, [stop]);

  return {
    videoRef,
    start,
    stop,
    flip,
    reset,
    status,
    receivedCount,
    totalChunks,
    facingMode,
  };
}
