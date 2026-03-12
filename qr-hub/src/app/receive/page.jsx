"use client";
import Link from "next/link";

export default function Receive() {
  return (
    <div className="min-h-screen bg-[var(--accent-secondary)] flex flex-col relative overflow-hidden">
      
      {/* Top Navigation - Mix of relative on mobile, absolute on desktop */}
      <div className="flex items-center justify-between p-6 z-20 text-white w-full md:absolute md:top-0 md:left-0 md:bg-transparent">
        <Link 
          href="/"
          className="brutal-btn bg-white text-black px-4 py-2 font-[family-name:var(--font-space-mono)] font-bold tracking-widest text-sm"
        >
          ← BACK
        </Link>
        
        <div className="flex gap-4">
          {/* Flash Toggle */}
          <button className="w-12 h-12 brutal-btn bg-white text-black flex items-center justify-center rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Flip Camera */}
          <button className="w-12 h-12 brutal-btn bg-white text-black flex items-center justify-center rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Central Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 w-full pb-48 md:pb-40">
          <h2 className="font-[family-name:var(--font-bebas-neue)] text-white text-4xl md:text-6xl mb-8 md:mb-12 tracking-wider text-center drop-shadow-md">
            SCAN QR CODE
          </h2>
          
          {/* The Scanner Viewfinder Container */}
          <div className="relative w-[80vw] max-w-[280px] md:max-w-[400px] aspect-square">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-12 md:w-16 h-12 md:h-16 border-t-8 border-l-8 border-[var(--bg)] -translate-x-3 -translate-y-3 md:-translate-x-4 md:-translate-y-4 z-20"></div>
            <div className="absolute top-0 right-0 w-12 md:w-16 h-12 md:h-16 border-t-8 border-r-8 border-[var(--bg)] translate-x-3 -translate-y-3 md:translate-x-4 md:-translate-y-4 z-20"></div>
            <div className="absolute bottom-0 left-0 w-12 md:w-16 h-12 md:h-16 border-b-8 border-l-8 border-[var(--bg)] -translate-x-3 translate-y-3 md:-translate-x-4 md:translate-y-4 z-20"></div>
            <div className="absolute bottom-0 right-0 w-12 md:w-16 h-12 md:h-16 border-b-8 border-r-8 border-[var(--bg)] translate-x-3 translate-y-3 md:translate-x-4 md:translate-y-4 z-20"></div>

            {/* Black Viewfinder Box */}
            <div className="absolute inset-0 bg-[#000000cc] border-[3px] border-black flex items-center justify-center overflow-hidden brutal-card !shadow-none">
                <p className="font-[family-name:var(--font-space-mono)] text-white/50 text-xs md:text-sm text-center z-0 px-4">Camera feed<br/>active...</p>
                
                {/* Scanning Laser Line */}
                <div className="absolute top-0 left-0 w-full h-1 md:h-2 bg-[var(--bg)] shadow-[0_0_12px_var(--bg)] md:shadow-[0_0_20px_var(--bg)] animate-[scan_2.5s_ease-in-out_infinite] z-30"></div>
            </div>
          </div>
          
          <p className="font-[family-name:var(--font-space-mono)] text-white/90 text-sm md:text-base mt-12 md:mt-16 text-center max-w-[260px] md:max-w-[400px]">
            Align QR code within the frame to start offline transfer.
          </p>
      </div>

      {/* Bottom Control Area - Full width on mobile and desktop */}
      <div className="absolute bottom-0 left-0 w-full bg-[#111] border-t-[3px] border-black text-white px-8 pt-12 pb-14 md:pb-8 flex justify-center items-center z-20 rounded-t-[40px] md:rounded-t-none md:h-24 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
            {/* Large Center Scan Button */}
            <button className="w-20 h-20 md:w-24 md:h-24 -mt-24 md:-mt-16 border-4 border-black bg-[var(--bg)] rounded-full flex items-center justify-center text-black brutal-btn shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] hover:-translate-y-1 transition-all z-30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
              </svg>
            </button>
      </div>
      
    </div>
  );
}
