import { motion, AnimatePresence } from 'framer-motion';
import TensionCord from './TensionCord';

const TH = ({ children, align = 'left', style }) => (
  <th className={`px-4 py-3.5 text-[9px] text-white/50 uppercase tracking-[0.12em] font-semibold whitespace-nowrap text-${align}`} style={style}>
    {children}
  </th>
);

const SkeletonCell = ({ width, height = 'h-[19px]', className = '' }) => (
  <div className={`shimmer ${height} ${width} ${className}`} />
);

function SkeletonRow() {
  return (
    <tr className="pointer-events-none">
      <td className="px-4 py-[17px] border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <SkeletonCell width="w-[22px]" height="h-4" />
          <SkeletonCell width="w-[52px]" height="h-[17px]" />
        </div>
      </td>
      <td className="px-4 py-[17px] border-b border-white/[0.05] text-right">
        <div className="flex flex-col items-end gap-1">
          <SkeletonCell width="w-[30px]" /><SkeletonCell width="w-[42px]" height="h-[9px]" />
        </div>
      </td>
      <td className="px-4 py-[17px] border-b border-white/[0.05] text-right">
        <div className="flex flex-col items-end gap-1">
          <SkeletonCell width="w-[30px]" /><SkeletonCell width="w-[42px]" height="h-[9px]" />
        </div>
      </td>
      <td className="px-4 py-[17px] border-b border-white/[0.05]">
        <SkeletonCell width="w-full" height="h-2" className="rounded-full" />
      </td>
      <td className="px-4 py-[17px] border-b border-white/[0.05] text-right">
        <div className="flex flex-col items-end gap-1">
          <SkeletonCell width="w-[56px]" height="h-[23px]" className="rounded-lg" />
          <SkeletonCell width="w-[42px]" height="h-[9px]" />
        </div>
      </td>
    </tr>
  );
}

export default function BoardTable({ leaderboard, categoryDesc, onRowClick }) {
  return (
    <section>
      {/* Header */}
      <div className="flex flex-col gap-1.5 mb-6">
        <h2 className="font-display text-[17px] font-bold tracking-[-0.01em]">Signal Triage Log</h2>
        <AnimatePresence mode="wait">
          <motion.p key={categoryDesc} className="text-[13px] text-dim font-light" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {categoryDesc}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Table — thead stays stable, only tbody content crossfades */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse font-mono">
          <thead>
            <tr className="bg-white/[0.025]">
              <TH style={{ width: '22%' }}>Ticker</TH>
              <TH align="right" style={{ width: '13%' }}>Hype</TH>
              <TH align="right" style={{ width: '13%' }}>Tape</TH>
              <th className="px-4 py-3.5 text-center" style={{ width: '38%' }}>
                <div className="flex items-center justify-center gap-5">
                  <span className="flex items-center gap-1.5 text-[9px] text-white/50 uppercase tracking-[0.12em] font-semibold whitespace-nowrap">
                    <span className="w-[6px] h-[6px] rounded-full bg-hype inline-block" />
                    Narrative
                  </span>
                  <span className="text-[9px] text-white/25 uppercase tracking-[0.12em] font-semibold">vs</span>
                  <span className="flex items-center gap-1.5 text-[9px] text-white/50 uppercase tracking-[0.12em] font-semibold whitespace-nowrap">
                    <span className="w-[6px] h-[6px] rounded-full bg-fund inline-block" />
                    Tape
                  </span>
                </div>
              </th>
              <TH align="right" style={{ width: '14%' }}>Delta</TH>
            </tr>
            <tr><td colSpan="5" className="h-px bg-white/[0.06] p-0" /></tr>
          </thead>
        </table>

        <AnimatePresence mode="wait">
          <motion.div
            key={leaderboard === null ? 'skeleton' : leaderboard.length === 0 ? 'empty' : 'data'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {leaderboard === null ? (
              <table className="w-full border-collapse font-mono">
                <tbody>{Array.from({ length: 10 }, (_, i) => <SkeletonRow key={i} />)}</tbody>
              </table>
            ) : leaderboard.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <svg className="w-11 h-11 text-dim opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h3 className="font-mono text-[14px] font-bold uppercase tracking-[0.08em]">No Telemetry Logs Generated</h3>
                <p className="text-[13px] text-dim font-light max-w-[320px]">The signal universe has returned an empty batch. Select another focus universe to prime the polygraph.</p>
              </div>
            ) : (
              <table className="w-full border-collapse font-mono">
                <tbody>
                  {leaderboard.map((row, i) => {
                    const isPos = row.divergence > 0;
                    const isNeg = row.divergence < 0;
                    const sign = isPos ? '+' : '';
                    const broken = [!row.redditOk && 'Reddit', !row.financeOk && 'Tape'].filter(Boolean);
                    const hasWarn = broken.length > 0;
                    const td = 'px-4 py-3 border-b border-white/[0.04] group-hover:bg-white/[0.025] transition-colors duration-100';
                    return (
                      <tr
                        key={row.ticker}
                        onClick={() => onRowClick(row.ticker)}
                        className="group cursor-pointer"
                      >
                        {/* Ticker */}
                        <td className={td}>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[9px] text-white/25 w-5 text-right flex-shrink-0">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="flex flex-col">
                              <span className="font-display text-[14px] font-bold tracking-wide text-white leading-none">{row.ticker}</span>
                              {hasWarn && (
                                <span className="text-[9px] text-warn mt-0.5 tracking-wide">⚠ {broken.join(' & ')} offline</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Hype */}
                        <td className={`${td} text-right`}>
                          <span className={`font-display text-[18px] font-bold leading-none ${row.redditOk ? 'text-hype' : 'text-white/20'}`}>
                            {row.redditOk ? row.hype : '—'}
                          </span>
                        </td>

                        {/* Tape */}
                        <td className={`${td} text-right`}>
                          <span className={`font-display text-[18px] font-bold leading-none ${row.financeOk ? 'text-fund' : 'text-white/20'}`}>
                            {row.financeOk ? row.fundamentals : '—'}
                          </span>
                        </td>

                        {/* Tension cord */}
                        <td className={td}><TensionCord row={row} /></td>

                        {/* Delta */}
                        <td className={`${td} text-right`}>
                          <span className={`inline-flex items-center justify-center min-w-[52px] px-2.5 py-1 rounded-md font-display font-bold text-[14px] ${
                            isPos ? 'bg-hype/[0.12] text-hype' :
                            isNeg ? 'bg-fund/[0.12] text-fund' :
                            'bg-white/[0.05] text-white/40'
                          }`}>
                            {row.redditOk && row.financeOk ? `${sign}${row.divergence}` : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
