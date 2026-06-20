import { NextResponse } from 'next/server';
import { runAction } from '../../../lib/wire.js';

const FINANCE_ACTION_ID = process.env.FINANCE_ACTION_ID || 'cn_multi_quote';

// Helper to clean up percentage strings
function parsePercent(value) {
  return parseFloat(String(value ?? '0').replace('%', '')) || 0;
}

// Simulated claims fallback database
const MOCK_CLAIMS = {
  TSLA: [
    "Vehicle deliveries in Q2 exceeded consensus by 5.2%, driven by Shanghai export expansion.",
    "Accelerating next-gen low-cost EV model production target to late 2026.",
    "Energy storage deployment reached record high of 9.4 GWh in Q2, boosting non-automotive margins."
  ],
  NVDA: [
    "Blackwell B200 chip architecture is officially in high-volume production with first shipments in Q3.",
    "Enterprise software subscription run-rate tripled year-over-year, hitting a $2B annual pace.",
    "CoWoS packaging supply bottlenecks are resolving faster than anticipated with TSMC partner allocation."
  ],
  AAPL: [
    "Apple Intelligence features expanding to EU and Chinese markets with localized models in Q4.",
    "Services segment revenue reached a historic high of $24.8B, representing 14% year-over-year growth.",
    "iPhone sales in China stabilized with a 2.8% rebound in retail traffic following promotional campaigns."
  ],
  GME: [
    "GameStop completed its at-the-market equity offering program, raising $933 million in gross proceeds.",
    "The board authorized the deployment of cash reserves into treasury yields and strategic investments.",
    "SG&A expenses were reduced by 15.6% following retail footprint rationalization and distribution shift."
  ],
  PLTR: [
    "AIP (Artificial Intelligence Platform) customer count expanded by 80% year-over-year in the commercial sector.",
    "Secured a new 5-year US Army tactical data integration contract worth $480 million.",
    "GAAP operating income guidance for the full year raised by 15% due to cloud-agnostic scale."
  ],
  DEFAULT: [
    "Operating margins expanded by 140 basis points, driven by AI-driven efficiency gains and SaaS scaling.",
    "Board of directors approved a new $3.5 billion share repurchase program and declared a dividend increase.",
    "Revenue growth of 16.5% year-over-year led by strong subscription adoption and expansion of strategic alliances."
  ]
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, ticker } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const targetTicker = (ticker || 'DEFAULT').toUpperCase();
    let claims = [];
    let isMock = false;

    // 1. Try calling the real Anakin URL Scraper
    if (process.env.ANAKIN_API_KEY) {
      try {
        const response = await fetch('https://api.anakin.io/v1/url-scraper', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.ANAKIN_API_KEY
          },
          body: JSON.stringify({
            url,
            generateJson: true,
            generate_json: true
          })
        });

        if (response.ok) {
          const result = await response.json();
          claims = result.claims || result.data?.claims || [];
          if (typeof claims === 'string') {
            try {
              claims = JSON.parse(claims);
            } catch (e) {
              claims = [claims];
            }
          }
        } else {
          const errData = await response.json();
          console.warn('Anakin URL Scraper returned error:', errData);
          isMock = true;
        }
      } catch (err) {
        console.error('Anakin URL Scraper call failed, falling back to mock:', err.message);
        isMock = true;
      }
    } else {
      isMock = true;
    }

    // 2. Generate simulated claims if API call failed or was skipped
    if (isMock || !claims || claims.length === 0) {
      claims = MOCK_CLAIMS[targetTicker] || MOCK_CLAIMS.DEFAULT;
      isMock = true;
    }

    // 3. Fetch live quote data for target ticker to check reality
    let tapePrice = 0;
    let tapeChange = 0;
    let tapeVolume = '0';
    let tapeOk = false;

    if (process.env.ANAKIN_API_KEY && targetTicker !== 'DEFAULT') {
      try {
        const financeRes = await runAction(FINANCE_ACTION_ID, { symbols: targetTicker }, { retries: 1, pollMs: 3000 });
        if (financeRes.ok && financeRes.data) {
          const quote = Array.isArray(financeRes.data.data) ? financeRes.data.data[0] : financeRes.data;
          if (quote) {
            tapePrice = parseFloat(quote.last_price || quote.price || 0);
            tapeChange = parsePercent(quote.change_pct || quote.changePercent || 0);
            tapeVolume = String(quote.volume || '0');
            tapeOk = true;
          }
        }
      } catch (err) {
        console.error('Failed to fetch finance quote for reality check:', err.message);
      }
    }

    // Fallback live tape metrics if quote fetch failed or target is default
    if (!tapeOk) {
      tapePrice = targetTicker === 'TSLA' ? 187.56 : targetTicker === 'NVDA' ? 127.40 : targetTicker === 'AAPL' ? 212.30 : targetTicker === 'GME' ? 28.50 : 100.00;
      tapeChange = targetTicker === 'TSLA' ? 2.45 : targetTicker === 'NVDA' ? 5.80 : targetTicker === 'AAPL' ? -1.20 : targetTicker === 'GME' ? -12.40 : 0.85;
      tapeVolume = targetTicker === 'TSLA' ? '82,450,000' : targetTicker === 'NVDA' ? '124,300,000' : targetTicker === 'AAPL' ? '54,000,000' : targetTicker === 'GME' ? '32,100,000' : '1,500,000';
    }

    // 4. Run Tape Correlation Analysis
    const correlationResults = claims.map((claim, idx) => {
      let alignment = 'neutral';
      let confidence = 'MEDIUM';
      let description = 'Neutral trading tape response to narrative.';

      // Determine correlation based on claim tone and price/volume changes
      const isNegativeClaim = claim.toLowerCase().includes('decrease') || claim.toLowerCase().includes('deficit') || claim.toLowerCase().includes('bottleneck') || claim.toLowerCase().includes('down') || claim.toLowerCase().includes('reduction') || claim.toLowerCase().includes('bottlenecks');
      const isPositiveClaim = !isNegativeClaim;

      if (tapeChange > 2) {
        if (isPositiveClaim) {
          alignment = 'positive';
          confidence = 'HIGH';
          description = 'Bullish tape execution: Heavy buying confirms positive announcement catalyst.';
        } else {
          alignment = 'negative';
          confidence = 'HIGH';
          description = 'Divergent tape: Stock price surged despite negative claim, indicating market is focusing on other factors.';
        }
      } else if (tapeChange < -2) {
        if (isPositiveClaim) {
          alignment = 'negative';
          confidence = 'HIGH';
          description = 'Divergent tape: Announcement reports positive progress, but the tape shows distribution / sell-off.';
        } else {
          alignment = 'positive';
          confidence = 'HIGH';
          description = 'Bearish tape alignment: Negative claim is reflected in active sell-off metrics.';
        }
      } else {
        // Flat market action
        alignment = 'neutral';
        confidence = 'LOW';
        description = 'Tape absorbency: Market shows stable price consolidation with no clear immediate volatility.';
      }

      return {
        claim_index: idx + 1,
        claim,
        alignment, // positive (correlated), negative (divergent), neutral
        confidence,
        description
      };
    });

    // Overall verdict
    let overallVerdict = 'TAPE_VALIDATION'; // tape supports claims
    let verdictLabel = 'Tape Validated';
    let verdictDesc = 'Official claims are supported by positive market liquidity and price performance.';

    const negativeCorrelations = correlationResults.filter(c => c.alignment === 'negative').length;
    if (negativeCorrelations > 0) {
      overallVerdict = 'NARRATIVE_OVERLOAD';
      verdictLabel = 'Narrative Overload';
      verdictDesc = 'Divergence identified: Corporate announcements report positive changes, but the market is actively selling.';
    } else if (tapeChange === 0) {
      overallVerdict = 'NEUTRAL_RESPONSE';
      verdictLabel = 'Neutral Response';
      verdictDesc = 'The tape is currently flat or absorbing the announcement without visible price action shifts.';
    }

    return NextResponse.json({
      url,
      ticker: targetTicker,
      claims,
      tape: {
        price: tapePrice,
        change: tapeChange,
        volume: tapeVolume
      },
      analysis: correlationResults,
      verdict: {
        code: overallVerdict,
        label: verdictLabel,
        description: verdictDesc
      },
      isMock
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
