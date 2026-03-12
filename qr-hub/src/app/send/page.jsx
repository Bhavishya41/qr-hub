"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function Send() {
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSend = () => {
    // Logic coming soon
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
        <div className="bg-black text-white font-[family-name:var(--font-bebas-neue)] text-3xl px-4 py-2 tracking-widest">
          SEND A FILE
        </div>
        
        <div className="p-8 flex flex-col gap-6">
          <div 
            onClick={handleUploadClick}
            className="border-[3px] border-dashed border-black p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-colors group"
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="arcs"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
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
                <div className="bg-white border-2 border-black p-4 group-hover:transform group-hover:-translate-y-1 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="arcs"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                </div>
                <div className="text-center">
                  <p className="font-[family-name:var(--font-archivo-black)] text-xl">CLICK TO CHOOSE FILE</p>
                  <p className="font-[family-name:var(--font-space-mono)] text-sm mt-1 opacity-60 italic">OR DRAG AND DROP</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={handleSend}
            disabled={!file}
            className={`brutal-btn w-full py-4 font-[family-name:var(--font-archivo-black)] text-2xl tracking-widest transition-all ${
              file ? "bg-[var(--accent-primary)] text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 shadow-none transform-none"
            }`}
          >
            GENERATE QR CODE
          </button>
        </div>
      </div>
    </div>
  );
}
