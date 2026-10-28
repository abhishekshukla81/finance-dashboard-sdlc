# Finance Dashboard

A React application that tracks IBM and four major competitors using Yahoo Finance market data.
Built with Vite, Recharts 3, and Zustand. Part of the IBM Bob SDLC Automation workshop.

## Tracked Companies

| Symbol | Company    |
|--------|------------|
| IBM    | IBM        |
| MSFT   | Microsoft  |
| ORCL   | Oracle     |
| SAP    | SAP        |
| CRM    | Salesforce |

## Dashboard Views

| Tab      | What it shows                                     |
|----------|---------------------------------------------------|
| Today    | Current-day quote card per company (price, Δ, volume, market cap) |
| 7 Days   | Relative performance line chart — all companies on one axis, indexed to 100 |
| Quarter  | 90-day area chart per company with QTD Δ%         |

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config and start dev server
cp .env.example .env
npm run dev
# → http://127.0.0.1:5173
```

Set `VITE_USE_MOCK=true` in `.env` to run fully offline with fixture data (the default).
Set `VITE_USE_MOCK=false` to fetch live data through the Vite dev proxy.

## Available Scripts

| Command             | Description                          |
|---------------------|--------------------------------------|
| `npm run dev`       | Start development server             |
| `npm run build`     | Production build to `dist/`          |
| `npm run preview`   | Serve production build locally       |
| `npm run lint`      | Lint with oxlint (0 warnings target) |
| `npm test`          | Run all unit tests with Vitest       |
| `npm run test:watch`| Watch mode for tests                 |

## Project Structure

```
src/
├── components/
│   ├── layout/      AppShell, Header, TabBar
│   ├── cards/       QuoteCard, ChangeIndicator
│   └── charts/      ComparisonChart, AreaChart
├── views/           DayView, WeekView, QuarterView
├── services/        yahooFinance.js, normalizer.js, mockData.js
├── hooks/           useQuotes.js, useHistory.js
├── store/           dashboardStore.js (Zustand)
├── constants/       tickers.js (add/swap companies here)
├── utils/           formatters.js
└── __tests__/       22 unit tests
```

## Data Layer

Live data is fetched via a Vite dev proxy that routes `/api/finance/*` to Yahoo Finance.
In production, deploy a backend proxy at `/api/finance/*` to avoid CORS and keep Yahoo
credentials server-side.

To add a competitor, edit [`src/constants/tickers.js`](src/constants/tickers.js) only.

## Testing

```bash
npm test
# 22 tests across 4 suites — normalizer, formatters, QuoteCard, DayView
```

Tests never make network calls. All async data paths use mock fixtures from
[`src/services/mockData.js`](src/services/mockData.js).

## CI

GitHub Actions (`.github/workflows/finance-app-ci.yml`) runs `npm install`,
`npm run lint`, `npm test`, and `npm run build` on every push to `main`,
`feature/**`, and `bob/**` branches, and on all pull requests.
