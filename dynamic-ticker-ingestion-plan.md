# Dynamic Ticker Ingestion, On-the-fly Mock Generation, Conditional Pagination

## Overview

Extend the finance dashboard (`finance-app/`) so that:

1. A deterministic generator can produce a realistic quote and 30-day history for ANY 1-5 letter ticker.
2. That generated data is served automatically when `VITE_USE_MOCK=true`, or when live Yahoo data fails or is rate limited, and the UI says so.
3. A ticker loaded in the Custom Company section is appended (deduplicated) to a dashboard company list in the store, and appears in Daily Performance Ranking and Quote Detail.
4. Those two sections paginate (6 per page, synchronized controls) only when more than 6 companies are present.

The Custom Company section stays unpaginated and unchanged in layout. Last 7 Days and Last Quarter are NOT touched at all (approved scope): no file edits, no fallback, no notice. Fallback and the simulated-data notice apply to the Today tab and the Custom panel only; added companies appear on the Today tab only.

Approach: additive and opt-in. New service modules, one new store slice, one new pagination component and one new notice component. The shared hooks gain an opt-in fallback option that defaults to off, so any caller that does not pass it (WeekView, QuarterView) behaves exactly as today, including the existing random-noise mock history.

## Acceptance Criteria

| ID | Criterion | Verified by |
|----|-----------|-------------|
| AC-1 | For any 1-5 letter symbol the generator returns a quote with price, open, high, low, change, changePercent, previousClose, volume, marketCap and 52-week low/high | Unit test |
| AC-2 | Generator output is deterministic: same symbol gives identical quote and identical price series on every call | Unit test |
| AC-3 | Quote values are internally consistent (low <= open and price <= high, change = price - previousClose, positive volume and market cap); different symbols give different values | Unit test |
| AC-4 | The history series is 30 days (31 points, matching the current Custom panel) and dates are relative to today | Unit test |
| AC-5 | With `VITE_USE_MOCK=true`, any valid ticker resolves to generated data; tracked companies keep their existing fixture values | Unit and hook tests |
| AC-6 | On Today and in the Custom panel (fallback opted in), live HTTP 429, 5xx, timeout or network failure falls back to generated data; HTTP 404 and an empty result for the requested symbol do NOT fall back and still show the no-data message | Service and hook tests |
| AC-7 | When any displayed data is simulated, the UI shows a visible notice (reason: mock mode or live data unavailable) | Component test |
| AC-8 | Loading a valid ticker renders it in the Custom panel AND appends it to the store company list; a ticker already tracked or already added is not duplicated | Store and flow tests |
| AC-9 | An added company appears in Daily Performance Ranking (ranked by daily change) and in Quote Detail with its quote and change data | Component and flow tests |
| AC-10 | With 6 or fewer companies no pagination controls are shown; with 7 or more, Previous / Page X of Y / Next appear on BOTH sections and exactly 6 companies are shown per page | Pagination and component tests |
| AC-11 | Pagination state is synchronized across the two sections; Previous is disabled on page 1 and Next on the last page; the page is clamped if the list shrinks | Pagination tests |
| AC-12 | Custom Company section is unpaginated and behaves as today (Load button, Currently showing, quote card, 30-day chart, Clear) | Existing tests plus flow test |
| AC-13 | Last 7 Days and Last Quarter are unchanged: `WeekView.jsx` and `QuarterView.jsx` are not modified, they never fall back, never show the notice, and are unaffected by added companies; their hook calls behave as today | Git diff shows no change to those files; existing tests; hook test proving default (no opt-in) behaviour is unchanged |
| AC-14 | `npm run validate` passes with 0 lint warnings | Validation gate |

## Decisions Needed Before Implementation

These come from the requirements and the code research. Each has a recommended default.

- **D1. The "No data found" message becomes unreachable in mock mode.** Requirement 1 says any valid ticker gets mock data, but the previously approved walkthrough and two existing tests expect AAPL to show "No data found" in mock mode. The no-data path remains live-mode only (HTTP 404 or empty result). Two existing tests must therefore be changed deliberately, which conflicts with "all existing tests continue to pass". Recommended default: accept this, update only those two tests, and keep the no-data path covered by the live-mode (mocked service) tests.
- **D2. Ordering of Quote Detail when paginated.** Ranking is ordered by daily change; Quote Detail today follows tracked order. If each keeps its own order, "Page 1" shows different companies in the two sections. Recommended default: when more than 6 companies exist, both sections use the same ranked order so each page shows the same six; with 6 or fewer, Quote Detail keeps today's order.
- **D3 (decided). Where fallback and the notice apply.** Today and the Custom panel only. Last 7 Days and Last Quarter are not touched. Because `useHistory` is shared, fallback is an opt-in option that defaults to off; only the Custom panel and Today pass it. Consequence to be aware of: if Yahoo rate limits, those two views keep showing their existing error state rather than simulated data.
- **D4. When a ticker is appended.** Recommended default: only after its quote resolves successfully (never for a failed or no-data symbol).
- **D5. Verification limit.** In forced mock mode, or when falling back after a 429, a ticker cannot be verified against Yahoo, so a made-up symbol such as QQQQQ will appear as a simulated company. The notice must say the data is simulated and unverified.

## Sub-Tasks

### Sub-Task 1: Deterministic mock generator
- **Intent:** One place that can fabricate a realistic, repeatable quote and 30-day series for any valid ticker.
- **Expected Outcomes:** A pure module, unit tested, that replaces random noise with a seeded sequence derived from the symbol. Tracked companies keep their existing fixture anchors.
- **Todo List:**
  1. Create a generator module in the service layer with a seeded pseudo-random source keyed by the symbol.
  2. Provide a quote generator (all fields listed in AC-1, plus a name placeholder and currency/market state defaults).
  3. Provide a history generator (31 points, same shape as `HistoryPoint`), anchored to the generated price.
  4. Make `mockData.js` delegate to it for quotes: tracked symbols still return the existing fixtures; every other symbol uses the generator. Leave the existing `generateMockHistory` (random noise, used by Week and Quarter in mock mode) as it is; the deterministic 30-day series is a separate function used only by the opt-in paths.
  5. Retire `MOCK_SUPPORTED_SYMBOLS` and the "unknown in mock mode" branch (see D1).
  6. Write unit tests for AC-1 to AC-4.
- **Relevant Context:** `finance-app/src/services/mockData.js` (FIXTURES, getMockQuote, generateMockHistory, MOCK_QUOTES); `finance-app/src/services/normalizer.js` (quote and history shapes).
- **Status:** [x] done

### Sub-Task 2: Service-layer fallback
- **Intent:** Decide in one place whether to serve live or generated data, and report which one was served.
- **Expected Outcomes:** Hooks receive data plus a source flag (live or simulated) and a reason; 429/5xx/timeout/network errors fall back, 404 and empty results do not.
- **Todo List:**
  1. Make `apiFetch` errors carry the HTTP status so callers can classify them (currently only the message text has it).
  2. Add a service function for quotes and one for history that return data, source and reason, applying the rules in AC-5 and AC-6.
  3. Extend `useQuotes` so mock mode builds quotes for the requested symbols (today it returns the fixed six regardless of input) and so it exposes the source flag. Its only caller is `DayView`.
  4. Extend `useHistory` with an opt-in `fallback` option (default off) that routes through the same service function and exposes the source flag. With the option off, the hook's behaviour and return values stay as today so `WeekView` and `QuarterView` are unaffected.
  5. Unit test the classification: 429, 503, timeout and network error fall back; 404 and empty do not. Add a test that, without the option, a 429 still surfaces as an error.
- **Relevant Context:** `finance-app/src/services/yahooFinance.js` (apiFetch, fetchQuotes, fetchHistory); `finance-app/src/hooks/useQuotes.js`; `finance-app/src/hooks/useHistory.js`.
- **Status:** [x] done

### Sub-Task 3: Store company list
- **Intent:** Hold the dynamically added companies separately from the fixed `TICKERS` list.
- **Expected Outcomes:** `TICKERS` is untouched; the store exposes the added companies and an add action that normalizes and deduplicates against both lists.
- **Todo List:**
  1. Add an added-companies list and an add action to the dashboard store.
  2. Deduplicate case-insensitively against `TICKERS` and existing entries.
  3. Add a fixed colour palette for added companies (cycled by position).
  4. Extend the store tests.
- **Relevant Context:** `finance-app/src/store/dashboardStore.js`; `finance-app/src/constants/tickers.js`; `finance-app/src/__tests__/dashboardStore.test.js`.
- **Status:** [x] done

### Sub-Task 4: Ingestion from the Custom Company section
- **Intent:** Loading a ticker also adds it to the dashboard, without changing how the Custom section looks or behaves.
- **Expected Outcomes:** After a successful load the symbol is in the store list; failed or no-data symbols are not added; Clear does not remove it.
- **Todo List:**
  1. Update `useCustomSymbolData` to drop the mock-mode unknown branch and to expose the source flag.
  2. In the Custom panel, once a quote resolves successfully, call the add action once per symbol.
  3. Add the simulated-data tag inside the panel when the source is simulated.
  4. Keep selector, "Currently showing", chart, no-data message and Clear exactly as they are.
- **Relevant Context:** `finance-app/src/hooks/useMarketData.js`; `finance-app/src/components/custom/CustomSymbolPanel.jsx`; `finance-app/src/components/custom/CompanySelector.jsx`; `finance-app/src/App.jsx`.
- **Status:** [x] done

### Sub-Task 5: Pagination logic and component
- **Intent:** A reusable, tested pagination primitive used only by the two dashboard sections.
- **Expected Outcomes:** Pure helper functions plus a Previous / Page X of Y / Next component that renders nothing when there is a single page.
- **Todo List:**
  1. Add a page-size constant of 6.
  2. Add pure helpers: page count, clamp, slice for a page.
  3. Add the pagination component with disabled states at the ends and accessible labels.
  4. Unit and component tests for AC-10 and AC-11.
- **Relevant Context:** `finance-app/src/constants`; new `finance-app/src/utils` helper; new `finance-app/src/components` pagination component. No existing pagination pattern exists; follow the CSS-module convention used in `components/custom/`.
- **Status:** [x] done

### Sub-Task 6: Dashboard integration (Today tab)
- **Intent:** Show tracked plus added companies in Daily Performance Ranking and Quote Detail, paginated.
- **Expected Outcomes:** Both sections read the same combined list, share one page state, and show controls only above 6 companies.
- **Todo List:**
  1. In `DayView`, build the symbol list from `TICKERS` plus the store list and fetch quotes for all of them.
  2. Take names and colours for added companies from their quotes and the palette.
  3. Apply the ordering decision D2, slice both sections by the shared page, and render the pagination component under each.
  4. Avoid blanking the whole view while an added company loads (keep the previous quotes visible during refetch).
  5. Update `PerformanceRanking` so rank numbers continue across pages (page 2 starts at 7).
- **Relevant Context:** `finance-app/src/views/DayView.jsx`; `finance-app/src/components/cards/PerformanceRanking.jsx`; `finance-app/src/components/cards/QuoteCard.jsx`.
- **Status:** [x] done

### Sub-Task 7: Simulated-data indicator
- **Intent:** Never show generated data without telling the user.
- **Expected Outcomes:** A small notice component, with text distinguishing mock mode from a live-data failure, shown on the Today tab and in the Custom panel whenever generated data is displayed.
- **Todo List:**
  1. Create the notice component (reason-aware wording, unverified wording for D5).
  2. Render it in `DayView` and the Custom panel only.
  3. Leave `WeekView`, `QuarterView` and the existing header MOCK badge as they are.
- **Relevant Context:** `finance-app/src/components/layout/Header.jsx` (existing badge style, not modified).
- **Status:** [x] done

### Sub-Task 8: Tests, docs and validation
- **Intent:** Prove the behaviour and keep the baseline green.
- **Expected Outcomes:** All new behaviour covered; only the two tests named in D1 changed; the gate passes.
- **Todo List:**
  1. Update the AAPL expectations in `useCustomSymbolData.test.jsx` and `CustomCompanyFlow.test.jsx` per D1.
  2. Add a flow test: load a new ticker, see it in ranking and detail, add enough companies to trigger pagination, step through pages, confirm the Custom section is unpaginated.
  3. Confirm the existing `DayView`, `PerformanceRanking`, `QuoteCard`, `normalizer`, `formatters` and `dashboardStore` tests still pass unchanged, and that `git diff` shows no change to `WeekView.jsx` or `QuarterView.jsx`.
  4. Update the README section on the Custom Company and mock mode.
  5. Run `npm run validate`, then check the pages visually in mock mode.
- **Relevant Context:** `finance-app/src/__tests__/`; `finance-app/package.json` (validate script); `finance-app/README.md`.
- **Status:** [x] done

## Files

**Create**
- `finance-app/src/services/mockGenerator.js` (generator; or placed inside `mockData.js` if you prefer one file)
- `finance-app/src/services/marketDataService.js` (live/fallback decision)
- `finance-app/src/utils/pagination.js`
- `finance-app/src/components/common/Pagination.jsx` and `Pagination.module.css`
- `finance-app/src/components/common/SimulatedDataNotice.jsx` and `.module.css`
- Tests: generator, marketDataService, pagination helpers, Pagination component, extended flow test

**Modify**
- `finance-app/src/services/yahooFinance.js` (attach HTTP status to errors only)
- `finance-app/src/services/mockData.js` (delegate to generator, deterministic history, drop supported-symbols list)
- `finance-app/src/hooks/useQuotes.js`, `useHistory.js`, `useMarketData.js`
- `finance-app/src/store/dashboardStore.js`
- `finance-app/src/constants/tickers.js` (page size and palette constants only; the `TICKERS` array itself is untouched)
- `finance-app/src/components/custom/CustomSymbolPanel.jsx`
- `finance-app/src/views/DayView.jsx`, `components/cards/PerformanceRanking.jsx`
- `finance-app/src/__tests__/useCustomSymbolData.test.jsx`, `CustomCompanyFlow.test.jsx`, `dashboardStore.test.js`
- `finance-app/README.md`

**Not modified:** `WeekView.jsx`, `QuarterView.jsx`, `CompanySelector.jsx`, `AreaChart.jsx`, `ComparisonChart.jsx`, `QuoteCard.jsx`, `AppShell.jsx`, `Header.jsx`.

## Risks

- Changing `useQuotes` and `useHistory` is the most invasive part because every view uses them; the existing test suite is the safety net.
- Refetching all quotes when one company is added could blank the Today view unless previous data is kept (Sub-Task 6, step 4).
- Generated data for an unverifiable ticker can look real; the notice wording matters (D5).
- Live mode was not verifiable here (Yahoo returned HTTP 429), so fallback behaviour is tested with mocked responses only.
