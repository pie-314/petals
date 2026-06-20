import { useRef, useEffect } from 'react';

export default function ConsoleScreen({ lines }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [lines]);

  return (
    <div
      ref={ref}
      className="bg-[#0a0c10] border border-white/[0.07] rounded-xl px-3.5 py-3.5 h-[148px] overflow-y-auto font-mono text-[10.5px] leading-[1.65] text-dim"
    >
      {lines.map((line, i) => (
        <div
          key={i}
          className={`mb-[5px] ${line.type === 'success' ? 'text-fund' : line.type === 'error' ? 'text-warn' : ''}`}
          style={line.type === 'error' ? { animation: 'diag-blink 1.1s steps(2,start) infinite' } : undefined}
        >
          {line.text}
        </div>
      ))}
    </div>
  );
}
