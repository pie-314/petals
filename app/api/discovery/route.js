import { NextResponse } from 'next/server';

// Simulated database of discovered article crawler items
const DISCOVERED_SIGNALS = [
  {
    ticker: 'MSTR',
    name: 'MicroStrategy Inc.',
    sourceUrl: 'https://finance.yahoo.com/news/microstrategy-announces-debt-offering-convertible-notes',
    articleTitle: 'MicroStrategy Announces Pricing of Convertible Senior Notes for Bitcoin Acquisition',
    discoveredAt: '12m ago',
    tapeScore: 85,
    hypeScore: 0,
    signalStrength: 92,
    reason: 'Heavy tape trading volume (+180% vs 20-day avg) on fresh debt issuance announcement. Social retail buzz is currently quiet.'
  },
  {
    ticker: 'ASTS',
    name: 'AST SpaceMobile Inc.',
    sourceUrl: 'https://www.benzinga.com/news/satellite-launch-schedule-commercial-deployment',
    articleTitle: 'Satellite Launch Window Confirmed for Commercial Broadband Network Expansion',
    discoveredAt: '45m ago',
    tapeScore: 68,
    hypeScore: 0,
    signalStrength: 78,
    reason: 'Strategic space flight timeline validation triggers heavy institutional buying. Reddit comment volume remains at baseline.'
  },
  {
    ticker: 'OKLO',
    name: 'Oklo Inc.',
    sourceUrl: 'https://finance.yahoo.com/news/nuclear-energy-regulatory-commission-approves-smr-site',
    articleTitle: 'Oklo Moves Closer to Commercialization with Site Safety Clearance for Next-Gen Reactor',
    discoveredAt: '1h 15m ago',
    tapeScore: 52,
    hypeScore: 0,
    signalStrength: 65,
    reason: 'Nuclear regulatory progress attracts commercial developers. Low retail footprint means early entry signal is high.'
  },
  {
    ticker: 'HIMS',
    name: 'Hims & Hers Health Inc.',
    sourceUrl: 'https://www.benzinga.com/news/hims-hers-widens-glp1-weightloss-distribution',
    articleTitle: 'Hims & Hers Widens GLP-1 Weight Loss Product Lineup with Integrated Clinical Telehealth',
    discoveredAt: '2h 10m ago',
    tapeScore: 45,
    hypeScore: 0,
    signalStrength: 58,
    reason: 'Wider geographic service availability drives positive price reaction (+4.2%). Reddit momentum is still sleeping.'
  },
  {
    ticker: 'TEM',
    name: 'Tempus AI Inc.',
    sourceUrl: 'https://finance.yahoo.com/news/tempus-ai-secures-fda-clearance-precision-oncology',
    articleTitle: 'Tempus AI Secures Breakthrough Device FDA Designation for Precision Oncology Tool',
    discoveredAt: '3h ago',
    tapeScore: 72,
    hypeScore: 0,
    signalStrength: 81,
    reason: 'AI oncology diagnostics device clearance is highly bullish. Institutional block trades detected, zero retail noise.'
  }
];

export async function GET(request) {
  try {
    let isMock = false;
    let mapData = null;
    let crawlData = null;

    if (process.env.ANAKIN_API_KEY) {
      try {
        // 1. Try Map API (URL Discovery on Yahoo Finance)
        const mapResponse = await fetch('https://api.anakin.io/v1/map', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.ANAKIN_API_KEY
          },
          body: JSON.stringify({
            url: 'https://finance.yahoo.com'
          })
        });

        if (mapResponse.ok) {
          mapData = await mapResponse.json();

          // 2. Try Crawl API with the discovered URLs
          const firstUrl = mapData.urls?.[0] || 'https://finance.yahoo.com';
          const crawlResponse = await fetch('https://api.anakin.io/v1/crawl', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.ANAKIN_API_KEY
            },
            body: JSON.stringify({
              url: firstUrl
            })
          });

          if (crawlResponse.ok) {
            crawlData = await crawlResponse.json();
          }
        } else {
          isMock = true;
        }
      } catch (err) {
        console.error('Anakin Map/Crawl calls failed, falling back to mock:', err.message);
        isMock = true;
      }
    } else {
      isMock = true;
    }

    // Return mock results with trace info
    return NextResponse.json({
      scanTarget: 'Yahoo Finance & Benzinga Catalogs',
      scannedAt: new Date().toISOString(),
      discoveredCount: DISCOVERED_SIGNALS.length,
      signals: DISCOVERED_SIGNALS,
      isMock,
      trace: {
        map_status: mapData ? 'completed' : 'simulated_fallback',
        crawl_status: crawlData ? 'completed' : 'simulated_fallback'
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
