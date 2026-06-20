"use client";
import { useEffect, useRef } from "react";

export default function AboutPage() {
  const petalContainerRef = useRef(null);

  // Sakura petals animation to match the landing page theme
  useEffect(() => {
    const container = petalContainerRef.current;
    if (!container) return;
    const MAX_PETALS = 15;
    const petals = [];
    let frame;

    function createPetal() {
      if (petals.length >= MAX_PETALS) return;
      const el = document.createElement("div");
      el.className = "sakura-petal";
      const size = Math.random() * 8 + 6;
      el.style.width = `${size}px`;
      el.style.height = `${size * 0.85}px`;
      el.style.left = `${Math.random() * window.innerWidth}px`;
      el.style.top = `-${size}px`;
      const p = {
        element: el,
        x: parseFloat(el.style.left),
        y: -size,
        size,
        xSpeed: Math.random() * 1.2 + 0.4,
        ySpeed: Math.random() * 1.0 + 0.6,
        wAngle: Math.random() * Math.PI,
        wSpeed: Math.random() * 0.02 + 0.01,
        rAngle: Math.random() * 360,
        rSpeed: Math.random() * 1.5 - 0.75,
        opacity: Math.random() * 0.3 + 0.4,
      };
      el.style.opacity = p.opacity;
      container.appendChild(el);
      petals.push(p);
    }

    function update() {
      if (Math.random() < 0.08 && petals.length < MAX_PETALS) createPetal();
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.y += p.ySpeed;
        p.wAngle += p.wSpeed;
        p.x += Math.sin(p.wAngle) * p.xSpeed;
        p.rAngle += p.rSpeed;
        p.element.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rAngle}deg)`;
        if (
          p.y > window.innerHeight + p.size ||
          p.x < -p.size ||
          p.x > window.innerWidth + p.size
        ) {
          p.element.remove();
          petals.splice(i, 1);
        }
      }
      frame = requestAnimationFrame(update);
    }

    frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      petals.forEach((p) => p.element.remove());
    };
  }, []);

  return (
    <>
      {/* Background Layer */}
      <div className="bg-parallax-layer" style={{ transform: "scale(1)", filter: "brightness(0.8)" }} />

      {/* Petals */}
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        ref={petalContainerRef}
      />

      <main className="max-w-4xl mx-auto px-6 pt-20 pb-20 relative z-[2]">
        <div className="bg-[rgba(10,12,18,0.85)] border border-white/[0.07] backdrop-blur-2xl rounded-[20px] p-8 md:p-10 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
          {/* Header */}
          <header className="mb-10 pb-6 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-hype font-bold">petals telemetry project</span>
              <h1 className="font-display text-[26px] font-bold tracking-tight text-white">
                Methodology & System Specs
              </h1>
            </div>
            
            <a
              href="/"
              className="inline-flex items-center gap-1.5 bg-white/[0.05] hover:bg-white/[0.08] text-white px-4 py-2 rounded-lg font-semibold text-xs active:scale-[0.96] border border-white/[0.08] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.1)] self-start md:self-auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Return to Triage Center
            </a>
          </header>

          {/* Section 1: Hype vs Tape Core */}
          <section className="mb-10">
            <h2 className="font-display text-lg font-bold text-ink mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-hype rounded" />
              The Hype vs. Tape Tension Model
            </h2>
            <p className="text-[13.5px] leading-[1.65] text-dim font-light">
              Traditional market analytics focuses entirely on price action, while social media listening isolates chat volume.
              <strong> petals</strong> functions as a market polygraph by analyzing the friction between the two. 
              When retail momentum on Reddit matches standard trade volume metrics, the market is in harmony. 
              However, severe divergence exposes arbitrage opportunities: narrative bubbles waiting to burst (high hype, low tape) or institutional positioning happening under the radar (high tape, zero hype).
            </p>
          </section>

          {/* Section 2: Mathematical Scoring Specs */}
          <section className="mb-10 bg-white/[0.015] border border-white/[0.05] rounded-xl p-6">
            <h2 className="font-display text-base font-bold text-ink mb-4 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-fund rounded" />
              Mathematical Formula Architecture
            </h2>
            
            <div className="flex flex-col gap-5 font-mono text-[12px]">
              {/* Reddit Hype */}
              <div className="border-b border-white/[0.04] pb-4">
                <div className="text-hype font-bold text-[10px] uppercase tracking-wider mb-1">1. Reddit Hype Score Engine</div>
                <div className="bg-[#0a0c10] p-3 rounded-lg border border-white/[0.05] text-ink my-1.5 text-center font-bold">
                  HypeRaw = (PostCount × 10) + ∑ (PostScore + CommentCount)
                </div>
                <p className="text-dim text-[11px] leading-[1.5] mt-1 font-sans font-light">
                  Captures both conversational breadth (post mentions) and depth (engagement metric integration). Normalized linearly on a scale of <code className="text-hype">0-100</code> against the loudest asset in the current focus watchlist.
                </p>
              </div>

              {/* Fundamentals Tape */}
              <div className="border-b border-white/[0.04] pb-4">
                <div className="text-fund font-bold text-[10px] uppercase tracking-wider mb-1">2. Fundamentals Tape Score Engine</div>
                <div className="bg-[#0a0c10] p-3 rounded-lg border border-white/[0.05] text-ink my-1.5 text-center font-bold">
                  TapeRaw = (PriceChange% × 15) + (log10(Volume + 1) × 12)
                </div>
                <p className="text-dim text-[11px] leading-[1.5] mt-1 font-sans font-light">
                  Combines rate of price change with log-scaled trading volume to extract pure momentum metrics. Normalized linearly on a scale of <code className="text-fund">0-100</code> against the most active trading asset.
                </p>
              </div>

              {/* Divergence */}
              <div>
                <div className="text-ink font-bold text-[10px] uppercase tracking-wider mb-1">3. Narrative Divergence Delta</div>
                <div className="bg-[#0a0c10] p-3 rounded-lg border border-white/[0.05] text-ink my-1.5 text-center font-bold">
                  Divergence = HypeScore - TapeScore
                </div>
                <p className="text-dim text-[11px] leading-[1.5] mt-1 font-sans font-light">
                  Subtracts actual tape momentum from retail hype. A positive score denotes <span className="text-hype font-semibold">Narrative Overload</span> (over-hyped), while a negative score represents <span className="text-fund font-semibold">Quiet Momentum</span> (accumulation).
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Anakin APIs Utilized */}
          <section className="mb-10">
            <h2 className="font-display text-lg font-bold text-ink mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-white/40 rounded" />
              Anakin API Integrations Catalog
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                <h3 className="font-display font-semibold text-sm text-ink mb-1.5">Wire Task Execution</h3>
                <p className="text-[12px] text-dim leading-[1.6] font-light">
                  Orchestrates search calls across social networks (Reddit catalog) and market databases (Finance quote feeds). Returns structured telemetry data used to calculate the live leaderboard.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                <h3 className="font-display font-semibold text-sm text-ink mb-1.5">URL Scraper & AI Extraction</h3>
                <p className="text-[12px] text-dim leading-[1.6] font-light">
                  Powers the "Corporate Reality Check" subsystem. Scrapes formal news release URLs, identifies core assertions using AI, and maps them to structured JSON claims payloads.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                <h3 className="font-display font-semibold text-sm text-ink mb-1.5">Map API (URL Discovery)</h3>
                <p className="text-[12px] text-dim leading-[1.6] font-light">
                  Traverses major financial catalog domains and indexes articles in real-time, building a dynamic URL inventory to monitor narrative shifts before they hit retail.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.01]">
                <h3 className="font-display font-semibold text-sm text-ink mb-1.5">Crawl API</h3>
                <p className="text-[12px] text-dim leading-[1.6] font-light">
                  Pulls raw site data at scale, processing sitemaps and text strings concurrently to index ticker counts and alert the dashboard of newly discussed equities.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Closed-loop Alerts */}
          <section className="mb-8">
            <h2 className="font-display text-lg font-bold text-ink mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-hype/70 rounded" />
              Closed-Loop Automation Webhooks
            </h2>
            <p className="text-[13.5px] leading-[1.65] text-dim font-light">
              Telemetry is actionable only when it connects to notification structures. Through the **Tension Webhooks** control center, users can link Slack or Discord channels. When any node triggers a divergence rating breaking the configurable threshold, a Wire task posts a rich embed summary card alerting operators directly on their devices.
            </p>
          </section>

          {/* Footer */}
          <footer className="mt-10 pt-5 border-t border-white/[0.05] flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
            <span>Petals // Telemetry Spec Documentation</span>
            <div className="flex gap-4">
              <a href="/" className="hover:text-ink transition-colors font-semibold text-fund">Dashboard Triage</a>
              <span>·</span>
              <span>Wire Integration Active</span>
            </div>
            <span>UTC 2026</span>
          </footer>
        </div>
      </main>
    </>
  );
}
