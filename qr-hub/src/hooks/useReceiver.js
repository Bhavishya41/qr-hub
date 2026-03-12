"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { openDB } from "idb";
import jsQR from "jsqr";

// ─── Constants ────────────────────────────────────────────────────────────────
const DB_NAME = "zero-wire-db";
const DB_VERSION = 1;
const STORE = "transfers";
const PROCESS_SIZE = 300;
const HEADER_SIZE = 7;       // FileID(2) + ChunkIndex(2) + TotalChunks(2) + Checksum(1)
const PAD_CHUNK_INDEX = 0xffff;
const META_CHUNK_INDEX = 0;  // Chunk 0 carries JSON metadata

// ─── DB ───────────────────────────────────────────────────────────────────────
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

// ─── latin-1 string → Uint8Array ─────────────────────────────────────────────
function latin1ToBytes(str) {
  const buf = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) buf[i] = str.charCodeAt(i) & 0xff;
  return buf;
}

// ─── Parse 7-byte binary header, validate XOR checksum ───────────────────────
function parseHeader(dataStr) {
  const bytes = latin1ToBytes(dataStr);
  if (bytes.length < HEADER_SIZE) return null;

  const view = new DataView(bytes.buffer);
  const fileId      = view.getUint16(0, false);
  const chunkIndex  = view.getUint16(2, false);
  const totalChunks = view.getUint16(4, false);
  const checksum    = bytes[6];

  // XOR checksum — if mismatch, discard chunk entirely
  let xor = 0;
  for (let i = HEADER_SIZE; i < bytes.length; i++) xor ^= bytes[i];
  if (xor !== checksum) return null;

  return { fileId, chunkIndex, totalChunks, payload: bytes.slice(HEADER_SIZE) };
}

 

// ─── Clear all chunks for a given fileId from IndexedDB ──────────────────────
async function clearTransfer(db, fileId) {
  const all = await db.getAllFromIndex(STORE, "fileId", fileId);
  const tx = db.transaction(STORE, "readwrite");
  await Promise.all(all.map((rec) => tx.store.delete(rec.id)));
  await tx.done;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export default function useReceiver() {
  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);   // hidden off-screen processing canvas
  const rafRef        = useRef(null);
  const streamRef     = useRef(null);
  const dbRef         = useRef(null);
  const seenRef       = useRef(new Set());
  const activeFileRef = useRef(null);   // { fileId, totalChunks }
  const fileNameRef   = useRef("zero-wire-file");
  const mimeTypeRef   = useRef("application/octet-stream");

  const [status, setStatus]          = useState("idle");
  const [receivedCount, setReceived] = useState(0);
  const [totalChunks, setTotal]      = useState(0);
  const [facingMode, setFacingMode]  = useState("environment");
  const [receivedIndices, setReceivedIndices] = useState(new Set());

  // ── Init DB on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    getDB().then((db) => (dbRef.current = db));
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Download assembled file + cleanup ────────────────────────────────────────
  const downloadFile = useCallback(async (fileId) => {
    const db = dbRef.current;
    if (!db) return;

    const all = await db.getAllFromIndex(STORE, "fileId", fileId);

    // Skip chunk 0 (metadata) — assemble only data chunks 1..N
    const dataChunks = all.filter((c) => c.chunkIndex !== META_CHUNK_INDEX);
    dataChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

    const blob = new Blob(dataChunks.map((c) => c.payload), {
      type: mimeTypeRef.current,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileNameRef.current;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    // Haptic feedback (silently ignored on devices that don't support it)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(200);
    }

    // Clean up IndexedDB — free user storage after successful download
    try {
      await clearTransfer(db, fileId);
    } catch { /* non-fatal */ }
  }, []);

  // ── Per-frame decode loop ────────────────────────────────────────────────────
  const processFrameRef = useRef(null);
  processFrameRef.current = async () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    const db     = dbRef.current;

    if (!video || !canvas || !db || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => processFrameRef.current());
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, PROCESS_SIZE, PROCESS_SIZE);
    const { data } = ctx.getImageData(0, 0, PROCESS_SIZE, PROCESS_SIZE);

    const decodes = [
      jsQR(data, PROCESS_SIZE, PROCESS_SIZE, { inversionAttempts: "dontInvert" }),
    ];

    for (const qr of decodes) {
      if (!qr?.data) continue;

      const header = parseHeader(qr.data);
      // parseHeader returns null if checksum fails — discard bad chunks
      if (!header) continue;

      const { fileId, chunkIndex, totalChunks, payload } = header;
      if (chunkIndex === PAD_CHUNK_INDEX) continue;

      const key = `${fileId}-${chunkIndex}`;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);

      // New file detected → reset tracking refs
      if (!activeFileRef.current || activeFileRef.current.fileId !== fileId) {
        seenRef.current = new Set([key]);
        activeFileRef.current = { fileId, totalChunks };
        fileNameRef.current  = "zero-wire-file";
        mimeTypeRef.current  = "application/octet-stream";
        setTotal(totalChunks);
        setReceived(0);
        setReceivedIndices(new Set([chunkIndex]));
      } else {
        setReceivedIndices(prev => {
          const next = new Set(prev);
          next.add(chunkIndex);
          return next;
        });
      }

      // ── Chunk 0: parse JSON metadata ──────────────────────────────────────
      if (chunkIndex === META_CHUNK_INDEX) {
        try {
          const meta = JSON.parse(new TextDecoder().decode(payload));
          if (meta.n) fileNameRef.current = meta.n;
          if (meta.m) mimeTypeRef.current = meta.m;
        } catch { /* malformed meta — keep defaults */ }
      }

      // Persist to IndexedDB (idempotent via compound key PK)
      try {
        await db.put(STORE, { id: key, fileId, chunkIndex, totalChunks, payload });
      } catch { /* duplicate put — safe to ignore */ }

      const count = await db.countFromIndex(STORE, "fileId", fileId);
      setReceived(count);
      setStatus("receiving");

      if (count >= totalChunks) {
        // Complete — stop camera and trigger download
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setStatus("done");
        await downloadFile(fileId);
        return;
      }
    }

    rafRef.current = requestAnimationFrame(() => processFrameRef.current());
  };

  // ── Start camera + loop ──────────────────────────────────────────────────────
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

      if (!canvasRef.current) {
        const c = document.createElement("canvas");
        c.width  = PROCESS_SIZE;
        c.height = PROCESS_SIZE;
        canvasRef.current = c;
      }

      setStatus("scanning");
      rafRef.current = requestAnimationFrame(() => processFrameRef.current());
    } catch {
      setStatus("error");
    }
  }, [facingMode]);

  // ── Stop ─────────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, []);

  // ── Flip camera ───────────────────────────────────────────────────────────────
  const flip = useCallback(async () => {
    stop();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, [stop]);

  // ── Reset for new transfer ────────────────────────────────────────────────────
  const reset = useCallback(() => {
    stop();
    seenRef.current      = new Set();
    activeFileRef.current = null;
    fileNameRef.current  = "zero-wire-file";
    mimeTypeRef.current  = "application/octet-stream";
    setReceived(0);
    setReceivedIndices(new Set());
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
    receivedIndices,
    totalChunks,
    facingMode,
  };
}
