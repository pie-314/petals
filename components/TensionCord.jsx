export default function TensionCord({ row }) {
  if (!row.redditOk || !row.financeOk) {
    const details = [!row.redditOk && 'REDDIT', !row.financeOk && 'TAPE'].filter(Boolean);
    return (
      <svg viewBox="0 0 200 32" className="w-full h-8 block overflow-visible" aria-label="Signal broken">
        <line x1="30" y1="16" x2="170" y2="16" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="3,3" />
        <rect x="40" y="6" width="120" height="20" rx="4" fill="rgba(208,144,64,0.08)" stroke="rgba(208,144,64,0.2)" strokeWidth="1" />
        <text x="100" y="18" fill="var(--color-warn)" fontFamily="var(--font-mono)" fontSize="8" textAnchor="middle" letterSpacing="0.08em">
          SIGNAL BROKEN: {details.join(' & ')}
        </text>
      </svg>
    );
  }

  const { divergence } = row;
  const xm = 100 - (divergence / 100) * 70;
  let left = null, right = null, fill = 'var(--color-dim)';

  if (divergence > 0) {
    const cx = (xm + 170) / 2;
    left  = <line x1="30" y1="16" x2={xm} y2="16" stroke="var(--color-hype)" strokeWidth="2.5" className="line-taut-hype" />;
    right = <path d={`M ${xm} 16 Q ${cx} 26 170 16`} stroke="rgba(201,120,128,0.05)" strokeWidth="1.5" strokeDasharray="3,2" fill="none" />;
    fill  = 'var(--color-hype)';
  } else if (divergence < 0) {
    const cx = (30 + xm) / 2;
    right = <line x1={xm} y1="16" x2="170" y2="16" stroke="var(--color-fund)" strokeWidth="3" className="line-taut-fund" />;
    left  = <path d={`M 30 16 Q ${cx} 26 ${xm} 16`} stroke="rgba(122,168,192,0.05)" strokeWidth="1.5" strokeDasharray="3,2" fill="none" />;
    fill  = 'var(--color-fund)';
  } else {
    left  = <line x1="30" y1="16" x2="100" y2="16" stroke="var(--color-dim)" strokeWidth="1.5" opacity="0.3" />;
    right = <line x1="100" y1="16" x2="170" y2="16" stroke="var(--color-dim)" strokeWidth="1.5" opacity="0.3" />;
  }

  return (
    <svg viewBox="0 0 200 32" className="w-full h-8 block overflow-visible" aria-label={`Tension delta: ${divergence}`}>
      <circle cx="30" cy="16" r="3.5" fill="var(--color-hype)" />
      <circle cx="170" cy="16" r="3.5" fill="var(--color-fund)" />
      {left}
      {right}
      <circle cx={xm} cy="16" r="4.5" fill={fill} style={{ transition: 'all 0.35s ease' }} />
      <circle cx={xm} cy="16" r="7.5" stroke={fill} strokeWidth="0.75" fill="none" opacity="0.2" />
    </svg>
  );
}
