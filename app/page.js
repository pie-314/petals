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

  // New Polishing Features States
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookThreshold, setWebhookThreshold] = useState(50);
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [realityUrl, setRealityUrl] = useState("");
  const [realityTicker, setRealityTicker] = useState("TSLA");
  const [realityLoading, setRealityLoading] = useState(false);
  const [realityResult, setRealityResult] = useState(null);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState([]);
  const [activeView, setActiveView] = useState("triage");

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

        // Automated Tension Alerts Configuration
        const alerts = board.filter(r => Math.abs(r.divergence) >= Number(webhookThreshold));
        if (alerts.length > 0) {
          logToConsole(`Alert condition met for ${alerts.length} node(s). Executing automated action...`, "success");
          alerts.forEach(async (alt) => {
            logToConsole(`Dispatching Tension Webhook card for $${alt.ticker} (Divergence: ${alt.divergence})`);
            try {
              const alertRes = await fetch('/api/alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ticker: alt.ticker,
                  divergence: alt.divergence,
                  hype: alt.hype,
                  fundamentals: alt.fundamentals,
                  webhookUrl: webhookUrl || undefined
                })
              });
              if (alertRes.ok) {
                const alertData = await alertRes.json();
                if (alertData.alertSent) {
                  logToConsole(`[SUCCESS] Webhook card delivered to ${alertData.targetChannel} for $${alt.ticker}.`, "success");
                } else {
                  logToConsole(`[INFO] Webhook simulated. Action ID: ${alertData.wireTask.action_id}`);
                }
              }
            } catch (err) {
              logToConsole(`Webhook dispatch failed: ${err.message}`, "error");
            }
          });
        }
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
    [logToConsole, webhookUrl, webhookThreshold],
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

  // Load alert settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUrl = localStorage.getItem("petals_webhook_url");
      const savedThresh = localStorage.getItem("petals_webhook_threshold");
      if (savedUrl) setWebhookUrl(savedUrl);
      if (savedThresh) setWebhookThreshold(Number(savedThresh));
    }
  }, []);

  const handleSaveWebhook = useCallback((url, thresh) => {
    localStorage.setItem("petals_webhook_url", url);
    localStorage.setItem("petals_webhook_threshold", String(thresh));
    logToConsole("Webhook configuration saved successfully.", "success");
    setShowWebhookSettings(false);
  }, [logToConsole]);

  const handleSendTestAlert = useCallback(async () => {
    logToConsole(`Dispatching test alert card for $TEST...`);
    try {
      const res = await fetch("/api/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: "TEST",
          divergence: 55,
          hype: 85,
          fundamentals: 30,
          webhookUrl: webhookUrl || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.alertSent) {
          logToConsole(`[SUCCESS] Test alert card successfully delivered to ${data.targetChannel}.`, "success");
        } else {
          logToConsole(`[INFO] Webhook simulated. Action ID: ${data.wireTask.action_id}`);
        }
      } else {
        logToConsole("Test alert failed to dispatch.", "error");
      }
    } catch (err) {
      logToConsole(`Test alert failed: ${err.message}`, "error");
    }
  }, [webhookUrl, logToConsole]);

  const handleFactCheck = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!realityUrl) return;
    setRealityLoading(true);
    logToConsole(`Triggering Corporate Reality Check for URL...`);
    try {
      const res = await fetch("/api/reality-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: realityUrl, ticker: realityTicker })
      });
      if (!res.ok) throw new Error(`Reality check failed (status ${res.status})`);
      const data = await res.json();
      setRealityResult(data);
      if (data.isMock) {
        logToConsole("[INFO] URL Scraper credits 0. Running high-fidelity AI simulation fallback.");
      } else {
        logToConsole("[OK] URL Scraper execution complete. Claims analyzed.", "success");
      }
    } catch (err) {
      logToConsole(`Reality check failed: ${err.message}`, "error");
    } finally {
      setRealityLoading(false);
    }
  }, [realityUrl, realityTicker, logToConsole]);

  const handleDiscoveryScan = useCallback(async () => {
    setDiscoveryLoading(true);
    logToConsole("Initializing web-scale Map & Crawl scanning node...");
    try {
      const res = await fetch("/api/discovery");
      if (!res.ok) throw new Error(`Discovery failed (status ${res.status})`);
      const data = await res.json();
      setDiscoveryResults(data.signals);
      if (data.isMock) {
        logToConsole("[INFO] Map/Crawl credits 0. Running high-fidelity scanner simulation.");
      } else {
        logToConsole("[OK] Map & Crawl web scanning cycles complete.", "success");
      }
    } catch (err) {
      logToConsole(`Discovery scan failed: ${err.message}`, "error");
    } finally {
      setDiscoveryLoading(false);
    }
  }, [logToConsole]);

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
          <header className="mb-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4 border-b border-white/[0.05] pb-6">
              {/* Wordmark */}
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">
                  pe<span className="text-hype">tals</span>
                </h2>
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-dim">
                  market polygraph
                </span>
              </div>

              {/* Top-Right Links & System Status */}
              <div className="flex items-center gap-5 font-mono text-[11px]">
                <a
                  href="/about"
                  className="text-hype hover:text-hype/80 transition-colors font-semibold"
                >
                  About Methodology
                </a>

                <span className="text-white/10 select-none">·</span>

                <a
                  href="https://github.com/pie-314/petals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors font-semibold flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                  </svg>
                  GitHub
                </a>

                {/* System status dots */}
                <div className="flex items-center gap-2 border-l border-white/10 pl-5 text-dim">
                  <span
                    className={`w-[6px] h-[6px] rounded-full flex-shrink-0 ${statusColor}`}
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
                    SYS: <strong className="text-ink">{systemStatus}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* View Switcher Sub-Header Controls */}
            <div className="flex items-center justify-between pb-4 mb-4 flex-wrap gap-4">
              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                {[
                  { id: "triage", label: "Triage Board", icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  )},
                  { id: "reality", label: "Corporate Reality Check", icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )},
                  { id: "discovery", label: "Signal Discovery", icon: (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a13.92 13.92 0 00-2.04-7.749L6.5 3m.5 18a9.5 9.5 0 009.5-9.5M12 11l.054-.09c.89-.136 1.721-.03 2.507.277m3.35 1.55l.088.156A13.916 13.916 0 0019 11a13.92 13.92 0 00-2.04-7.749L16.5 3M3 12a9 9 0 019-9M3 12a9 9 0 009 9" />
                    </svg>
                  )},
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveView(tab.id)}
                    className={`relative flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.06em] px-4 py-2.5 rounded-lg cursor-pointer transition-colors z-[1] select-none ${
                      activeView === tab.id ? 'text-white' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {activeView === tab.id && (
                      <motion.div
                        layoutId="active-view-pill"
                        className="absolute inset-0 rounded-lg bg-white/[0.05] border border-white/10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {tab.icon}
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Alert Webhook Action Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowWebhookSettings(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-semibold text-xs border active:scale-[0.96] transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.2)] ${
                    showWebhookSettings 
                      ? 'bg-hype text-white border-[#a5606a]' 
                      : 'bg-white/[0.05] hover:bg-white/[0.08] text-white border-white/[0.08]'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Alert Webhooks
                </button>
              </div>
            </div>
          </header>

          {/* Webhook Configuration Panel */}
          <AnimatePresence>
            {showWebhookSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                animate={{ height: "auto", opacity: 1, marginBottom: 24 }}
                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden bg-white/[0.015] border border-white/[0.06] rounded-2xl"
              >
                <div className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display text-[15px] font-bold text-ink">Tension Webhook Alerts</h3>
                      <p className="text-[12px] text-dim font-light mt-0.5">Configure Discord or Slack webhook endpoints to automate narrative-market tension updates.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWebhookSettings(false)}
                      className="text-dim hover:text-ink cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[280px] flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">Webhook Endpoint URL</label>
                      <input
                        type="url"
                        placeholder="https://discord.com/api/webhooks/... or https://hooks.slack.com/services/..."
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="bg-white/[0.03] border border-white/[0.08] text-white rounded-lg px-3.5 py-2 text-xs outline-none focus:border-hype/50 transition-colors w-full"
                      />
                    </div>
                    <div className="w-[170px] flex flex-col gap-1.5">
                      <label className="font-mono text-[9px] uppercase tracking-[0.08em] text-dim">Divergence Trigger Threshold</label>
                      <select
                        value={webhookThreshold}
                        onChange={(e) => setWebhookThreshold(Number(e.target.value))}
                        className="bg-[#0a0c10] border border-white/[0.08] text-white rounded-lg px-3 py-2 text-xs outline-none focus:border-hype/50 cursor-pointer"
                      >
                        <option value={20}>± 20 points</option>
                        <option value={30}>± 30 points</option>
                        <option value={40}>± 40 points</option>
                        <option value={50}>± 50 points (Default)</option>
                        <option value={60}>± 60 points</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveWebhook(webhookUrl, webhookThreshold)}
                        className="bg-fund hover:bg-fund/95 text-black px-4 py-2.5 rounded-lg font-semibold text-xs transition-transform cursor-pointer"
                      >
                        Save Configuration
                      </button>
                      <button
                        type="button"
                        onClick={handleSendTestAlert}
                        className="bg-white/[0.05] hover:bg-white/[0.08] text-white px-4 py-2.5 rounded-lg font-semibold text-xs border border-white/[0.08] transition-transform cursor-pointer"
                      >
                        Test Webhook
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sub-header controls (only visible for active triage view) */}
          {activeView === "triage" && (
            <div className="flex items-end justify-between gap-6 flex-wrap mb-8">
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
                      className="relative font-mono text-[11px] uppercase tracking-[0.08em] px-4 py-2.5 rounded-lg z-[1] disabled:opacity-40 disabled:cursor-not-allowed select-none"
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

              {/* Refresh + stats */}
              <div className="flex items-center gap-4">
                <div className="font-mono text-[10px] text-dim flex flex-col gap-1 text-right mr-1">
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
          )}

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

          {/* New Interactive Subsystems Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 border-t border-white/[0.05] pt-8">
            
            {/* Corporate Reality Check subsystem */}
            <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="w-[30px] h-[30px] rounded-lg bg-hype/10 border border-hype/20 flex items-center justify-center text-hype">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-bold text-ink">Corporate Reality Check</h3>
                  <p className="text-[12px] text-dim font-light">Directly fact-check news URLs against live quotes.</p>
                </div>
              </div>

              <form onSubmit={handleFactCheck} className="flex gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="url"
                  required
                  placeholder="Paste news release URL (e.g. Yahoo Finance, PR Newswire)..."
                  value={realityUrl}
                  onChange={(e) => setRealityUrl(e.target.value)}
                  className="bg-white/[0.03] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-xs outline-none focus:border-hype/50 transition-colors flex-1 min-w-[200px]"
                />
                
                <select
                  value={realityTicker}
                  onChange={(e) => setRealityTicker(e.target.value)}
                  className="bg-[#0a0c10] border border-white/[0.08] text-white rounded-lg px-2 py-2.5 text-xs outline-none focus:border-hype/50 cursor-pointer"
                >
                  <optgroup label="Active Watchlist">
                    <option value="TSLA">TSLA</option>
                    <option value="NVDA">NVDA</option>
                    <option value="AAPL">AAPL</option>
                    <option value="GME">GME</option>
                    <option value="PLTR">PLTR</option>
                  </optgroup>
                </select>

                <button
                  type="submit"
                  disabled={realityLoading || !realityUrl}
                  className="inline-flex items-center gap-1.5 bg-hype hover:bg-hype/90 text-white px-4 py-2.5 rounded-lg font-semibold text-xs active:scale-[0.96] border border-[#a5606a] transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)]"
                >
                  {realityLoading ? (
                    <>
                      <svg className="animate-spin w-3 h-3 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Checking...
                    </>
                  ) : 'Fact Check'}
                </button>
              </form>

              {/* Reality Check Analysis Result display */}
              <AnimatePresence mode="wait">
                {realityResult ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="border border-white/[0.06] bg-white/[0.005] rounded-xl p-4 flex flex-col gap-4 font-mono text-[11px]"
                  >
                    {/* Header: Ticker quote & Verdict */}
                    <div className="flex justify-between items-start gap-4 flex-wrap border-b border-white/[0.05] pb-3">
                      <div>
                        <span className="text-white font-bold text-xs">MARKET QUOTE VERDICT</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            realityResult.verdict.code === 'TAPE_VALIDATION' ? 'bg-fund/12 text-fund border border-fund/25' :
                            realityResult.verdict.code === 'NARRATIVE_OVERLOAD' ? 'bg-hype/12 text-hype border border-hype/25' :
                            'bg-white/10 text-white/60'
                          }`}>
                            {realityResult.verdict.label}
                          </span>
                          <span className="text-dim">|</span>
                          <span className="text-ink">${realityResult.tape.price}</span>
                          <span className={realityResult.tape.change >= 0 ? 'text-fund' : 'text-hype'}>
                            {realityResult.tape.change >= 0 ? '+' : ''}{realityResult.tape.change}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-dim">
                        <div>TAPE VOL: {realityResult.tape.volume}</div>
                        <div>TICKER: {realityResult.ticker}</div>
                      </div>
                    </div>

                    <p className="text-dim leading-[1.5] italic">{realityResult.verdict.description}</p>

                    {/* Claims analysis */}
                    <div className="flex flex-col gap-2.5 mt-1">
                      <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Extracted AI Claims & Alignment:</span>
                      {realityResult.analysis.map((item, index) => (
                        <div key={index} className="p-3 bg-white/[0.015] border border-white/[0.05] rounded-lg flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-ink font-bold">Claim #{item.claim_index}</span>
                            <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold ${
                              item.alignment === 'positive' ? 'text-fund' :
                              item.alignment === 'negative' ? 'text-hype' :
                              'text-white/40'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                item.alignment === 'positive' ? 'bg-fund' :
                                item.alignment === 'negative' ? 'bg-hype' :
                                'bg-white/20'
                              }`} />
                              {item.alignment === 'positive' ? 'Correlated' :
                               item.alignment === 'negative' ? 'Divergent' :
                               'Neutral'}
                            </span>
                          </div>
                          <p className="text-white/80 font-sans text-xs leading-[1.5]">{item.claim}</p>
                          <p className="text-dim text-[10px] leading-[1.4] border-t border-white/[0.03] pt-1.5 mt-0.5">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[120px] flex items-center justify-center border border-dashed border-white/[0.07] rounded-xl text-dim text-[11px] font-mono select-none">
                    Awaiting news announcement URL analysis...
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Web-Scale Discovery Scanner subsystem */}
            <div className="bg-white/[0.015] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-[30px] h-[30px] rounded-lg bg-fund/10 border border-fund/20 flex items-center justify-center text-fund">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a13.92 13.92 0 00-2.04-7.749L6.5 3m.5 18a9.5 9.5 0 009.5-9.5M12 11l.054-.09c.89-.136 1.721-.03 2.507.277m3.35 1.55l.088.156A13.916 13.916 0 0019 11a13.92 13.92 0 00-2.04-7.749L16.5 3M3 12a9 9 0 019-9M3 12a9 9 0 009 9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display text-[15px] font-bold text-ink">Web-Scale Signal Discovery</h3>
                    <p className="text-[12px] text-dim font-light">Scan financial blogs to identify narrative shifts before social hype.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDiscoveryScan}
                  disabled={discoveryLoading}
                  className="inline-flex items-center gap-1.5 bg-fund hover:bg-fund/95 text-black px-4 py-2.5 rounded-lg font-semibold text-xs active:scale-[0.96] transition-transform cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                >
                  {discoveryLoading ? (
                    <>
                      <svg className="animate-spin w-3 h-3 text-black" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Scanning Blogs...
                    </>
                  ) : 'Scan Web Logs'}
                </button>
              </div>

              {/* Discovery Table Results */}
              <div className="w-full overflow-hidden border border-white/[0.05] rounded-xl font-mono text-[11px]">
                {discoveryResults.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] text-white/50 text-left">
                          <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[9px]">Ticker</th>
                          <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[9px]">Tape Score</th>
                          <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[9px]">Social Hype</th>
                          <th className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[9px] text-right">Early Signal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {discoveryResults.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.01] transition-colors group">
                            <td className="px-3.5 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-display font-bold text-[13px] text-white group-hover:text-fund transition-colors">${item.ticker}</span>
                                <span className="text-[9px] text-dim truncate max-w-[120px]">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-3.5 py-3 align-middle">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-fund text-xs">{item.tapeScore}</span>
                                <div className="w-16 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                                  <div className="h-full bg-fund rounded-full" style={{ width: `${item.tapeScore}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-3.5 py-3 align-middle text-hype/50 font-bold">
                              0 <span className="text-[9px] text-white/25">(Early stage)</span>
                            </td>
                            <td className="px-3.5 py-3 text-right align-middle">
                              <div className="flex flex-col items-end gap-1">
                                <span className="px-2 py-0.5 bg-fund/10 text-fund rounded text-[10px] font-bold">
                                  Str: {item.signalStrength}%
                                </span>
                                <span className="text-[8px] text-dim">{item.discoveredAt}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-3 bg-white/[0.015] border-t border-white/[0.05] text-[10px] text-dim leading-[1.4] text-center">
                      ⚡ Map discovered sitemap nodes. Crawl completed ticker mentions tracking.
                    </div>
                  </div>
                ) : (
                  <div className="h-[148px] flex flex-col items-center justify-center gap-2 text-dim text-center px-6 select-none">
                    <svg className="w-6 h-6 text-white/20 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Tap "Scan Web Logs" to crawl blog networks for early tickers.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex justify-between mt-8 pt-5 border-t border-white/[0.05] font-mono text-[9px] uppercase tracking-[0.1em] text-dim">
            <span>Petals // Telemetry Project</span>
            <div className="flex gap-4">
              <a href="/about" className="hover:text-ink transition-colors font-semibold text-hype">Methodology Details</a>
              <span>·</span>
              <span>Built on Wire Networks</span>
            </div>
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
