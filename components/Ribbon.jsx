export default function Ribbon({ text }) {
  return (
    <div className="sticky top-0 z-[100] overflow-hidden border-b border-white/[0.12] bg-[rgba(10,12,18,0.72)] backdrop-blur-xl py-2.5">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
          <div className="ribbon-track">
            <span className="flex-shrink-0 pr-8">{text}</span>
            <span className="flex-shrink-0 pr-8">{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
