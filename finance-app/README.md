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
| Today    | Daily Performance Ranking and a quote card per company (price, Δ, volume, market cap), including added tickers, 8 per page |
| 7 Days   | Relative performance line chart — top 8 companies on one axis, indexed to 100 |
| Quarter  | 90-day area chart for the top 8 companies with QTD Δ% |

## Custom Company

At the bottom of every tab, below the existing view, a **Custom Company** section has one line of
instruction, a ticker input and a **Load** button. Tickers must be 1–5 letters; anything else shows
an inline error. A valid, resolvable symbol opens a panel with "Currently showing: XYZ", the
company's quote card and a 30-day price chart. A symbol with no data shows `No data found for
symbol "XYZ". Check the ticker and try again.` instead of any other company's data. **Clear**
removes the panel, and the selection persists when you switch tabs. The tracked-company
dashboards above are unchanged.

### Dynamic tickers and pagination

A ticker that loads successfully in the Custom Company section is also added to the **Today** tab
(Daily Performance Ranking and Quote Detail). Tickers are normalised, never duplicated (including
the six tracked companies), and kept for the session; **Clear** does not remove them. Symbols that
fail or return no data are never added. Added tickers also appear in the ticker input's
suggestion list.

**Last 7 Days** and **Last Quarter** include added companies too, but show only the **top 8** by
today's Daily Performance Ranking (a caption reads "Showing top 8 of N companies"). Their history
falls back to simulated data like the Today tab, with the same notice.

Above 8 companies both Today sections show 8 per page with Previous / Page X of Y / Next controls.
They share one page and one ranked order, and rank numbers continue across pages (page 2 starts
at 9). With 8 or fewer companies there are no controls.

### Simulated data

For any valid ticker without live data the app generates deterministic **simulated** quotes and a
30-day history (same ticker, same numbers). Tracked companies keep their fixed fixture values.

- `VITE_USE_MOCK=true`: every valid ticker resolves to simulated data.
- `VITE_USE_MOCK=false`: HTTP 429, HTTP 5xx, timeouts and network failures fall back to simulated
  data. HTTP 404 and empty results do **not** fall back and still show the no-data message.
- Whenever simulated data is displayed on the Today tab or in the Custom panel, a notice says it is
  generated and unverified. A made-up ticker therefore appears as a simulated company; it is not
  checked against a real market.

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
| `npm run validate`  | Lint, test and build in one step     |
| `npm test`          | Run all unit tests with Vitest       |
| `npm run test:watch`| Watch mode for tests                 |

## Project Structure

```
src/
├── components/
│   ├── layout/      AppShell, Header, TabBar
│   ├── cards/       QuoteCard, ChangeIndicator
│   ├── custom/      CompanySelector, CustomSymbolPanel
│   ├── common/      Pagination, SimulatedDataNotice
│   └── charts/      ComparisonChart, AreaChart
├── views/           DayView, WeekView, QuarterView
├── services/        yahooFinance.js, normalizer.js, mockData.js, mockGenerator.js, marketDataService.js
├── hooks/           useQuotes.js, useHistory.js, useHistories.js, useTopCompanies.js, useMarketData.js
├── store/           dashboardStore.js (Zustand)
├── constants/       tickers.js (add/swap companies here)
├── utils/           formatters.js, symbols.js, pagination.js, ranking.js
└── __tests__/       unit tests
```

## Data Layer

Live data is fetched via a Vite dev proxy that routes `/api/finance/*` to Yahoo Finance.
In production, deploy a backend proxy at `/api/finance/*` to avoid CORS and keep Yahoo
credentials server-side.

To add a competitor, edit [`src/constants/tickers.js`](src/constants/tickers.js) only.

## Testing

```bash
npm test
# normalizer, formatters, symbols, store, QuoteCard, DayView, PerformanceRanking, CompanySelector, CustomSymbolPanel,
# useCustomSymbolData, custom-company flow, mock generator, fallback service/hooks, pagination, simulated notice,
# top-8 Week/Quarter views, useTopCompanies, useHistories
```

Tests never make network calls. All async data paths use mock fixtures from
[`src/services/mockData.js`](src/services/mockData.js).

## CI

GitHub Actions (`.github/workflows/finance-app-ci.yml`) runs `npm install`,
`npm run lint`, `npm test`, and `npm run build` on every push to `main`,
`feature/**`, and `bob/**` branches, and on all pull requests.
