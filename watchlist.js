export const DEFAULT_CATEGORY = 'all';

export const WATCHLISTS = {
  all: {
    label: 'All Signals',
    description: 'A wider 30-name board across AI, meme, mobility, and retail momentum.',
    tickers: [
      'TSLA', 'GME', 'NVDA', 'AMC', 'PLTR', 'AAPL', 'AMD', 'COIN', 'RIVN', 'SOFI',
      'MSTR', 'HOOD', 'RDDT', 'RKLB', 'ASTS', 'AVGO', 'SMCI', 'ARM', 'MU', 'MRVL',
      'QCOM', 'INTC', 'AMAT', 'ANET', 'ORCL', 'APP', 'HIMS', 'TEM', 'CAVA', 'OKLO',
    ],
  },
  ai: {
    label: 'AI And Semis',
    description: 'Chipmakers, AI infrastructure names, and software tied to compute demand.',
    tickers: [
      'NVDA', 'AMD', 'AVGO', 'SMCI', 'ARM', 'MU', 'MRVL', 'QCOM', 'INTC', 'AMAT',
      'ANET', 'ORCL', 'PLTR', 'APP', 'TEM',
    ],
  },
  momentum: {
    label: 'Momentum Retail',
    description: 'Names that tend to get attention fast when social momentum picks up.',
    tickers: [
      'GME', 'AMC', 'PLTR', 'SOFI', 'HOOD', 'RDDT', 'RKLB', 'ASTS', 'HIMS', 'CAVA',
      'OKLO', 'APP',
    ],
  },
  mobility: {
    label: 'Mobility And EV',
    description: 'Electric vehicles, autonomy, and adjacent transport plays.',
    tickers: [
      'TSLA', 'RIVN', 'LCID', 'NIO', 'XPEV', 'LI', 'F', 'GM', 'UBER', 'LYFT',
      'QS', 'CHPT',
    ],
  },
  crypto: {
    label: 'Crypto And Fintech',
    description: 'Brokerage, payments, and crypto-linked equities.',
    tickers: [
      'COIN', 'MSTR', 'HOOD', 'SOFI', 'PYPL', 'SQ', 'MARA', 'RIOT', 'CLSK', 'CORZ',
      'IREN',
    ],
  },
};

export function getCategory(slug) {
  return WATCHLISTS[slug] ? slug : DEFAULT_CATEGORY;
}

export function getWatchlist(slug) {
  const category = getCategory(slug);
  return WATCHLISTS[category];
}

export function listCategories() {
  return Object.entries(WATCHLISTS).map(([slug, config]) => ({
    slug,
    label: config.label,
    description: config.description,
    count: config.tickers.length,
  }));
}
