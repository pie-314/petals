const ECG_PATH = {
  hot:  'M0,30 L45,30 L55,10 L65,50 L75,30 L115,30 L125,5 L135,55 L145,30 L200,30',
  cold: 'M0,30 L35,30 L45,15 L55,45 L65,30 L105,30 L115,8 L125,52 L135,30 L200,30',
};

export default function AnomalyCard({ type, ticker, val, desc }) {
  const hot = type === 'hot';
  return (
    <div className={`relative overflow-hidden rounded-[20px] p-6 border transition-transform duration-200 hover:-translate-y-px bg-white/[0.025] ${hot ? 'border-hype/20 [background-image:linear-gradient(135deg,rgba(201,120,128,0.04),transparent_65%)]' : 'border-fund/20 [background-image:linear-gradient(135deg,rgba(122,168,192,0.04),transparent_65%)]'}`}>

      {/* ECG trace */}
      <svg className="absolute bottom-[-5px] left-0 w-full h-[70px] opacity-[0.06] pointer-events-none z-0" viewBox="0 0 200 60" preserveAspectRatio="none">
        <path
          d={ECG_PATH[type]}
          stroke={`var(--color-${hot ? 'hype' : 'fund'})`}
          strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 400, animation: 'ecg-pulse 7s linear infinite' }}
        />
      </svg>

      {/* Label */}
      <div className={`absolute top-0 right-0 font-mono text-[9px] font-bold tracking-[0.1em] px-3 py-1.5 rounded-bl-xl uppercase ${hot ? 'bg-hype/14 text-hype' : 'bg-fund/14 text-fund'}`}>
        {hot ? 'Narrative Overload' : 'Quiet Momentum'}
      </div>

      {/* Ticker + value */}
      <div className="flex items-baseline gap-3 mb-3 relative z-[1]">
        <span className="font-display text-[28px] font-bold text-ink tracking-[0.02em]">{ticker ?? '—'}</span>
        <span className={`font-mono text-sm font-bold ${hot ? 'text-hype' : 'text-fund'}`}>{val}</span>
      </div>

      <p className="text-[13px] leading-[1.6] text-dim relative z-[1] font-light">{desc}</p>
    </div>
  );
}
