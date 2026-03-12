"use client";
import Link from "next/link";

export default function Send() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 flex flex-col justify-center items-center relative">
      <Link 
        href="/"
        className="absolute top-4 left-4 z-10 brutal-btn bg-white text-black px-4 py-2 font-[family-name:var(--font-space-mono)] font-bold tracking-widest text-sm"
      >
        ← BACK
      </Link>

      <div className="brutal-card w-full max-w-[600px] flex flex-col">
        <div className="bg-black text-white font-[family-name:var(--font-bebas-neue)] text-3xl px-4 py-2 tracking-widest">
          SEND A FILE
        </div>
        
        <div className="p-6">
          <p className="font-[family-name:var(--font-archivo-black)] text-center">Implementation coming next...</p>
        </div>
      </div>
    </div>
  );
}
