export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center px-12 py-16 w-full mt-20 mb-12 relative z-[2] bg-[rgba(10,12,18,0.82)] border border-white/[0.07] backdrop-blur-2xl rounded-[20px] shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
      <h1 className="font-display text-[4rem] font-bold leading-[1.1] tracking-[-0.03em] text-ink mb-5">
        narrative meets momentum
      </h1>
      <p className="text-[1.0625rem] text-white max-w-[640px] mb-9 leading-[1.65] font-light">
        A premium telemetry board tracking the divergence between retail social chatter and real market tape volume.
        Identify internet hype, evaluate tape trends, and isolate opportunities before the crowd corrects.
      </p>
      <a
        href="#dashboard-anchor"
        className="inline-flex items-center gap-2 bg-hype hover:bg-hype/90 text-white px-7 py-3 rounded-lg font-semibold text-sm active:scale-[0.96] border border-[#a5606a] transition-transform cursor-pointer no-underline shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.12)]"
      >
        Enter Telemetry Board
      </a>
    </section>
  );
}
