'use client';

export default function Drawer({ ticker, state, summary, errorMsg, seconds, onClose }) {
  const open = !!ticker;

  return (
    <div className={`fixed inset-0 z-[200] pointer-events-none ${open ? 'pointer-events-auto' : ''}`}>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-[rgba(0,0,0,0.55)] backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <div className={`absolute top-0 right-0 h-full w-[480px] max-w-[92vw] bg-[rgba(14,17,25,0.97)] border-l border-white/[0.08] flex flex-col shadow-[-24px_0_48px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[9px] font-bold tracking-[0.15em] uppercase text-dim bg-white/[0.04] border border-white/[0.07] px-2.5 py-1 rounded-full w-fit">
              AI Analysis Node
            </span>
            <h3 className="font-display text-[18px] font-bold tracking-[-0.01em]">
              {ticker ? `${ticker} Narrative Investigation` : 'Ticker Detective'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="relative overflow-hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-white text-[18px] leading-none bg-white/[0.06] border border-white/[0.12] active:scale-[0.96] transition-transform after:absolute after:inset-0 after:pointer-events-none after:rounded-lg after:content-[''] after:bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(255,255,255,0.08)_0%,transparent_72%)]"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-7 py-6">

          {state === 'loading' && (
            <div className="flex flex-col gap-5 animate-drawer-in">
              {/* Scanner bar */}
              <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-hype rounded-full"
                  style={{ animation: 'progress 20s linear forwards', width: '0%' }}
                />
              </div>

              {/* Spinner row */}
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white/10 border-t-hype flex-shrink-0"
                  style={{ animation: 'spin 0.75s linear infinite' }}
                />
                <p className="font-mono text-[12px] text-dim">
                  Triggering Anakin Agentic Search for {ticker}…
                </p>
              </div>

              {/* Skeleton lines */}
              {[100, 88, 94, 70, 82].map((w, i) => (
                <div key={i} className={`shimmer h-[13px] rounded`} style={{ width: `${w}%` }} />
              ))}

              <div className="font-mono text-[10px] text-dim mt-2">
                POLLED RESEARCH ACTIVE: <span className="text-ink font-semibold">{seconds}s</span>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col gap-4 animate-drawer-in">
              <div className="flex items-start gap-3 bg-warn/[0.07] border border-warn/20 rounded-xl px-4 py-3.5">
                <svg className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="font-mono text-[11px] text-warn">Analysis failed: {errorMsg}</p>
              </div>
            </div>
          )}

          {(state === 'content' || state === 'idle') && (
            <div className="animate-drawer-in">
              {state === 'idle' ? (
                <p className="text-[14px] text-dim leading-[1.7] font-light">
                  Select a ticker node from the telemetry board to run an Anakin Agentic Search. It will scrape recent web sentiment, identify narrative-vs-tape catalysts, and output a cited summary report.
                </p>
              ) : (
                <div className="text-[14px] leading-[1.75] font-light text-white whitespace-pre-wrap">
                  {summary}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
