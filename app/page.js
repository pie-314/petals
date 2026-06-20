"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Hero from "../components/Hero";
import AnomalyCard from "../components/AnomalyCard";
import ConsoleScreen from "../components/ConsoleScreen";
import BoardTable from "../components/BoardTable";
import Drawer from "../components/Drawer";

const LOADING_TIPS = [
  "Acquiring connection channel to Wire...",
  "Searching Reddit forums for ticker chatter metrics...",
  "Tabulating social volume & comment intensity...",
  "Fetching price momentum and relative volume statistics...",
  "Resolving scoring norms (0-100 values) for dataset...",
  "Normalizing trade tape averages...",
  "Structuring divergence algorithms (Hype minus Tape)...",
  "Sorting Leaderboard indices by gap delta...",
  "Balancing physical string tension models...",
];

function describeHot(row) {
  if (!row) return "No overhyped narratives identified in this dataset.";
  if (row.divergence > 0)
    return `Market chatter dominates. ${row.ticker} is drawing intense conversation (${row.hype}/100) running ahead of its actual tape volume and price indices (${row.fundamentals}/100).`;
  return `${row.ticker} is leading the leaderboard, but narrative levels remain aligned with core market changes.`;
}

function describeCold(row) {
  if (!row) return "No quietly moving tickers identified in this dataset.";
  if (row.divergence < 0)
    return `Substance outweighs chatter. ${row.ticker} is printing heavy tape movement (${row.fundamentals}/100) on minimal social metrics (${row.hype}/100). Quiet outlier.`;
  return `${row.ticker} is tracking closely to baseline volumes without significant narrative divergence.`;
}

export default function Page() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [systemStatus, setSystemStatus] = useState("INITIALIZING");
  const [generatedAt, setGeneratedAt] = useState("Awaiting load...");
  const [healthStat, setHealthStat] = useState("0 / 0 OK");
  const [ribbonText, setRibbonText] = useState(
    "Acquiring market pulse signal...  ·  Awaiting full connection parameters...",
  );
  const [consoleLines, setConsoleLines] = useState([
    { text: "[OK] BOOT SEQUENCE INITIATED", type: "normal" },
    { text: "[OK] AWAITING INTEGRATION SELECTOR", type: "normal" },
  ]);
  const [hotRow, setHotRow] = useState(null);
  const [coldRow, setColdRow] = useState(null);
  const [categoryDesc, setCategoryDesc] = useState(
    "Select a category to populate narrative-gap telemetry.",
  );

  const [drawerTicker, setDrawerTicker] = useState(null);
  const [drawerState, setDrawerState] = useState("idle");
  const [drawerSummary, setDrawerSummary] = useState("");
  const [drawerErrorMsg, setDrawerErrorMsg] = useState("");
  const [drawerSeconds, setDrawerSeconds] = useState(0);

  const petalContainerRef = useRef(null);
  const bgParallaxRef = useRef(null);
  const drawerTimerRef = useRef(null);
  const tipsIntervalRef = useRef(null);
  const isRefreshing = useRef(false);

  const logToConsole = useCallback((message, type = "normal") => {
    const time = new Date().toLocaleTimeString();
    setConsoleLines((prev) => [
      ...prev,
      { text: `[${time}] ${message}`, type },
    ]);
  }, []);

  // Sakura petals
  useEffect(() => {
    const container = petalContainerRef.current;
    if (!container) return;
    const MAX_PETALS = Math.min(25, Math.floor(window.innerWidth / 40));
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
        xSpeed: Math.random() * 1.5 + 0.5,
        ySpeed: Math.random() * 1.2 + 0.8,
        wAngle: Math.random() * Math.PI,
        wSpeed: Math.random() * 0.02 + 0.01,
        rAngle: Math.random() * 360,
        rSpeed: Math.random() * 2 - 1,
        opacity: Math.random() * 0.4 + 0.5,
      };
      el.style.opacity = p.opacity;
      container.appendChild(el);
      petals.push(p);
    }

    function update() {
      if (Math.random() < 0.1 && petals.length < MAX_PETALS) createPetal();
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

  // Parallax
  useEffect(() => {
    const bg = bgParallaxRef.current;
    if (!bg) return;
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0,
      frame;

    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * -15;
      ty = (e.clientY / window.innerHeight - 0.5) * -15;
    };

    function lerp() {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      bg.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(1.05)`;
      frame = requestAnimationFrame(lerp);
    }

    window.addEventListener("mousemove", onMove);
    frame = requestAnimationFrame(lerp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const refresh = useCallback(
    async (category) => {
      if (isRefreshing.current) return;
      isRefreshing.current = true;
      setLeaderboard(null);
      setSystemStatus("ACQUIRING SIGNAL FEED");

      let tipIdx = 0;
      logToConsole(LOADING_TIPS[0]);
      clearInterval(tipsIntervalRef.current);
      tipsIntervalRef.current = setInterval(() => {
        tipIdx = (tipIdx + 1) % LOADING_TIPS.length;
        logToConsole(LOADING_TIPS[tipIdx]);
      }, 3500);

      try {
        const res = await fetch(`/api/refresh?category=${category || "all"}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const board = data.leaderboard;

        setLeaderboard(board);
        setGeneratedAt(
          `UTC ${new Date(data.generatedAt).toLocaleTimeString()}`,
        );
        const healthy = board.filter((r) => r.redditOk && r.financeOk).length;
        setHealthStat(`${healthy} / ${board.length} OK`);

        const hot =
          board.find((r) => r.redditOk && r.financeOk && r.divergence > 0) ||
          board[0] ||
          null;
        const cold =
          [...board]
            .reverse()
            .find((r) => r.redditOk && r.financeOk && r.divergence < 0) ||
          board[board.length - 1] ||
          null;
        setHotRow(hot);
        setColdRow(cold);

        setRibbonText(
          board
            .map(
              (r) =>
                `${r.ticker} ${r.redditOk && r.financeOk ? `${r.divergence > 0 ? "▲ +" : "▼ "}${r.divergence}` : "[!] ERR"}`,
            )
            .join("  ·  "),
        );

        setSystemStatus("ACTIVE");
        logToConsole("Acquisition cycle complete. Grid synced.", "success");
        board.forEach((r) => {
          if (!r.redditOk || !r.financeOk) {
            const errs = [
              !r.redditOk && "reddit_timeout",
              !r.financeOk && "market_fetch_failure",
            ].filter(Boolean);
            logToConsole(
              `Telemetry alert on Node ${r.ticker}: ${errs.join(", ")}`,
              "error",
            );
          }
        });
      } catch (err) {
        logToConsole(
          `Telemetry acquisition cycle failed: ${err.message}`,
          "error",
        );
        setSystemStatus("OFFLINE");
        setLeaderboard([]);
      } finally {
        clearInterval(tipsIntervalRef.current);
        isRefreshing.current = false;
      }
    },
    [logToConsole],
  );

  useEffect(() => {
    async function init() {
      logToConsole("Fetching universe configuration feeds...");
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Could not acquire ticker universes");
        const data = await res.json();
        setCategories(data.categories);
        setSelectedCategory(data.defaultCategory);
        const cat = data.categories.find(
          (c) => c.slug === data.defaultCategory,
        );
        if (cat)
          setCategoryDesc(
            `${cat.description} Tracking ${cat.count} nodes in universe.`,
          );
        logToConsole("Universe configuration populated.", "success");
        await refresh(data.defaultCategory);
      } catch (err) {
        logToConsole(`Initialization failed: ${err.message}`, "error");
        setSystemStatus("OFFLINE");
        setLeaderboard([]);
      }
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryClick = useCallback(
    async (slug) => {
      if (slug === selectedCategory || isRefreshing.current) return;
      setSelectedCategory(slug);
      setCategories((prev) => {
        const cat = prev.find((c) => c.slug === slug);
        if (cat)
          setCategoryDesc(
            `${cat.description} Tracking ${cat.count} nodes in universe.`,
          );
        return prev;
      });
      await refresh(slug);
    },
    [selectedCategory, refresh],
  );

  const openDrawer = useCallback(
    async (ticker) => {
      setDrawerTicker(ticker);
      setDrawerState("loading");
      setDrawerSeconds(0);
      clearInterval(drawerTimerRef.current);
      drawerTimerRef.current = setInterval(
        () => setDrawerSeconds((s) => s + 1),
        1000,
      );
      logToConsole(`Launching agentic search node for ticker ${ticker}...`);

      try {
        const res = await fetch(`/api/explain?ticker=${ticker}`);
        if (!res.ok)
          throw new Error(`Investigation failed (status ${res.status})`);
        const data = await res.json();
        setDrawerSummary(data.summary);
        setDrawerState("content");
        logToConsole(
          `Agentic report for ${ticker} successfully compiled.`,
          "success",
        );
      } catch (err) {
        setDrawerErrorMsg(err.message);
        setDrawerState("error");
        logToConsole(
          `Agentic search for ${ticker} failed: ${err.message}`,
          "error",
        );
      } finally {
        clearInterval(drawerTimerRef.current);
      }
    },
    [logToConsole],
  );

  const closeDrawer = useCallback(() => {
    setDrawerTicker(null);
    clearInterval(drawerTimerRef.current);
  }, []);

  useEffect(
    () => () => {
      clearInterval(drawerTimerRef.current);
      clearInterval(tipsIntervalRef.current);
    },
    [],
  );

  const isLoading =
    systemStatus === "INITIALIZING" || systemStatus === "ACQUIRING SIGNAL FEED";
  const categoryLabel =
    categories.find((c) => c.slug === selectedCategory)?.label || "—";
  const statusColor =
    systemStatus === "ACTIVE"
      ? "bg-fund"
      : systemStatus === "OFFLINE"
        ? "bg-warn"
        : "bg-white/40";

  return (
    <>
      {/* Parallax BG */}
      <div className="bg-parallax-layer" ref={bgParallaxRef} />

      {/* Petals container */}
      <div
        className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
        ref={petalContainerRef}
      />

      <div id="dashboard-anchor" style={{ scrollMarginTop: "80px" }} />

      <main className="max-w-7xl mx-auto px-6 pt-20 pb-20 relative z-[2]">
        {/* App deck */}
        <div className="bg-[rgba(10,12,18,0.82)] border border-white/[0.07] backdrop-blur-2xl rounded-[20px] p-8 shadow-[0_24px_48px_rgba(0,0,0,0.35)]">
          {/* App header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              {/* Wordmark */}
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
                  pe<span className="text-hype">tals</span>
                </h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                  market polygraph
                </span>
              </div>

              {/* System meta */}
              <div className="flex items-center gap-6 font-mono text-[11px] text-dim">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${statusColor}`}
                    style={
                      systemStatus === "ACTIVE"
                        ? {
                            animation:
                              "dot-pulse 1.6s ease-in-out infinite alternate",
                          }
                        : undefined
                    }
                  />
                  <span>
                    SYSTEM:{" "}
                    <AnimatePresence mode="wait">
                      <motion.strong
                        key={systemStatus}
                        className="text-ink"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {systemStatus}
                      </motion.strong>
                    </AnimatePresence>
                  </span>
                </div>
                <div>
                  CHANNEL:{" "}
                  <AnimatePresence mode="wait">
                    <motion.strong
                      key={categoryLabel}
                      className="text-ink"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {categoryLabel}
                    </motion.strong>
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-end justify-between gap-6 flex-wrap">
              {/* Category selector */}
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-dim">
                  Select Signal Universe
                </span>
                <div className="relative flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat.slug}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleCategoryClick(cat.slug)}
                      animate={{
                        color:
                          cat.slug === selectedCategory
                            ? "#ffffff"
                            : "rgba(255,255,255,0.5)",
                      }}
                      transition={{ duration: 0.2 }}
                      className="relative font-mono text-[11px] uppercase tracking-[0.08em] px-4 py-2 rounded-lg z-[1] disabled:opacity-40 disabled:cursor-not-allowed select-none"
                    >
                      {cat.slug === selectedCategory && (
                        <motion.div
                          layoutId="category-pill"
                          className="absolute inset-0 rounded-lg bg-hype border border-[#a5606a] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className="relative z-[1] font-semibold">
                        {cat.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Refresh + meta */}
              <div className="flex items-center gap-5">
                <div className="font-mono text-[10px] text-dim flex flex-col gap-1 text-right">
                  <div>
                    Capture Feed:{" "}
                    <span className="text-ink">{generatedAt}</span>
                  </div>
                  <div>
                    Telemetry Status:{" "}
                    <span className="text-ink">{healthStat}</span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => refresh(selectedCategory)}
                  className="inline-flex items-center gap-1.5 bg-hype hover:bg-hype/90 text-white px-5 py-2.5 rounded-lg font-semibold text-xs active:scale-[0.96] border border-[#a5606a] transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.12)]"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    style={
                      isLoading
                        ? { animation: "spin 0.75s linear infinite" }
                        : undefined
                    }
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                  Acquire Snapshot
                </button>
              </div>
            </div>
          </header>

          {/* Content grid */}
          <div className="grid grid-cols-[1fr_320px] gap-8 items-start">
            {/* Board */}
            <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6">
              <BoardTable
                leaderboard={leaderboard}
                categoryDesc={categoryDesc}
                onRowClick={openDrawer}
              />
            </div>

            {/* Aside */}
            <div className="flex flex-col gap-5">
              <AnomalyCard
                type="hot"
                ticker={hotRow?.ticker ?? null}
                val={hotRow ? `+${hotRow.divergence}` : "—"}
                desc={describeHot(hotRow)}
              />
              <AnomalyCard
                type="cold"
                ticker={coldRow?.ticker ?? null}
                val={coldRow ? `${coldRow.divergence}` : "—"}
                desc={describeCold(coldRow)}
              />

              {/* Diagnostics */}
              <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="8" rx="2" />
                    <rect x="2" y="14" width="20" height="8" rx="2" />
                    <line x1="6" y1="6" x2="6.01" y2="6" />
                    <line x1="6" y1="18" x2="6.01" y2="18" />
                  </svg>
                  Telemetry System Log
                </div>
                <ConsoleScreen lines={consoleLines} />
                <div className="font-mono text-[10px] leading-[1.6] text-dim border-t border-white/[0.05] pt-4">
                  <p className="font-semibold text-ink mb-1">
                    Reading Tension Cords:
                  </p>
                  <p>
                    A straight vibrating{" "}
                    <span className="text-hype">Rose Line</span> shows
                    narratives leading fundamentals. A thick straight{" "}
                    <span className="text-fund">Blue Line</span> shows real
                    market activity outpacing chatter.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex justify-between mt-8 pt-5 border-t border-white/[0.05] font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
            <span>Petals // Telemetry Project</span>
            <span>Built on Wire Networks</span>
            <span>Sys Time UTC: {new Date().getFullYear()}</span>
          </footer>
        </div>
      </main>

      <Drawer
        ticker={drawerTicker}
        state={drawerState}
        summary={drawerSummary}
        errorMsg={drawerErrorMsg}
        seconds={drawerSeconds}
        onClose={closeDrawer}
      />
    </>
  );
}
