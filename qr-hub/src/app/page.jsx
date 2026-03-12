import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg)] p-4 relative">
      <div className="absolute top-0 left-4 font-[family-name:var(--font-bebas-neue)] text-[18px] tracking-widest h-10 w-40 text-[#000]">
        <img src="logo.png"></img>
      </div>
      
      <div className="flex flex-col gap-12 w-full max-w-[600px] mt-8">
        <h1 className="font-[family-name:var(--font-bebas-neue)] text-5xl md:text-7xl leading-[0.85] text-center tracking-wide text-[#000]">
          SEND FILES.<br />
          NO INTERNET.<br />
          JUST LIGHT.
        </h1>
        
        <div className="flex w-full gap-4">
          <Link 
            href="/send" 
            className="brutal-btn flex items-center justify-center flex-1 min-h-[64px] bg-white border-[3px] border-[var(--accent-primary)] text-black font-[family-name:var(--font-bebas-neue)] text-4xl tracking-wider uppercase h-full"
          >
            SEND
          </Link>
          
          <Link 
            href="/receive" 
            className="brutal-btn flex items-center justify-center flex-1 min-h-[64px] bg-[var(--accent-secondary)] border-[3px] border-black text-white font-[family-name:var(--font-bebas-neue)] text-4xl tracking-wider uppercase h-full"
          >
            RECEIVE
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-center font-[family-name:var(--font-space-mono)] text-[11px] font-bold text-black uppercase w-full left-0">
        v1.0 — offline only — no servers
      </div>
    </div>
  );
}
