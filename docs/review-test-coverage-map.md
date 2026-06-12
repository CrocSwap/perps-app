# Test Coverage Map

## Overview

The current test suite now covers the first fast validation layer for the perps
app: referral/refreg utilities, deterministic data processors, worker message
normalization, transaction-service envelopes, provider fetch boundaries, and
polling/notification managers. The repo now also has a narrow Playwright
Chromium smoke layer for route rendering through the real browser app shell.
Visual trading workflows, wallet flows, and chart interactions remain outside
the current coverage.

## Current Test Harness

- Runner: Vitest.
- Config: `packages/frontend/vitest.config.ts`.
- Environment: `node`.
- Include pattern: `app/**/*.test.{ts,tsx}`.
- CI command: `pnpm test:ci`.
- Coverage command: `pnpm test:coverage`.
- Current result: 13 test files, 93 tests passing.
- Current coverage baseline: statements 28.86%, branches 18.52%, functions
  23.5%, lines 29.42%.

The repo now declares `@vitest/coverage-v8` as a direct frontend dev dependency.
It still does not declare Testing Library, jsdom/happy-dom, or MSW.

## Current Browser Smoke Harness

- Runner: Playwright.
- Config: `packages/frontend/playwright.config.ts`.
- Browser project: Chromium desktop.
- Test directory: `packages/frontend/e2e`.
- Command: `pnpm test:smoke`.
- Current result: 10 route smoke tests passing.
- Current route set: `/`, `/v2/trade`, `/v2/portfolio`, `/v2/referrals`,
  `/v2/vaults`, `/v2/agents`, `/v2/more`, `/v2/privacy`, `/v2/terms`, and a
  not-found route.

## What Is Covered

| Area                                | Files                                       | What It Proves                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Referral store cache and migrations | `app/stores/ReferralStore.test.ts`          | Cache approval rules, migration normalization, and protection against passive URL overwrites.                                                                                                                             |
| Referral provider boundaries        | `app/stores/ReferralStore.provider.test.ts` | Affiliate-code fetch success/failure, conversion checks across Fuul programs, persisted conversion short-circuiting, malformed payloads, non-OK responses, timeouts, and claims fallback behavior.                        |
| Info/provider fixtures              | `app/hooks/useInfoApi.provider.test.ts`     | Hyperliquid spot/token payload parsing, malformed spot metadata fallback, token detail numeric conversion, and Fogo JSON-RPC fixture envelope shape.                                                                      |
| Referral/refreg instruction helpers | `app/utils/refreg.test.ts`                  | Instruction tags, byte layouts, PDA derivation, referral kind detection, localStorage reads, send sequencing, failure continuation, and attributed-count fetch query construction.                                        |
| App refreg gating                   | `app/contexts/AppContext.test.ts`           | The connect-wallet referral flow only runs when the session, sender, wallet/session keys, payer, cached code, and invitee approval are present.                                                                           |
| Explorer tx links                   | `app/utils/Constants.test.ts`               | `getTxLink` handles empty signatures, testnet/mainnet URL shape, and custom explorer envs.                                                                                                                                |
| Market ID lookup                    | `app/utils/marketIdToName.test.ts`          | BTC market ID lookup across bigint/number/string inputs and fallback behavior for invalid or unknown inputs.                                                                                                              |
| Data processors                     | `app/processors/*.test.ts`                  | Order book totals/ratios, trade side mapping, user order normalization, positions, symbol info, balances, fills, TWAP, funding, deposit/withdrawal, and vault normalization.                                              |
| Worker message handlers             | `app/hooks/workers/*.test.ts`               | `orderbook.worker` and `webdata2.worker` output shapes for fixture messages and error envelopes for malformed messages.                                                                                                   |
| Transaction services                | `app/services/transactionServices.test.ts`  | Limit/market/cancel/margin/deposit/withdraw success and failure envelopes, mocked builder parameters, instruction forwarding, scaling, and refreg follow-up triggers.                                                     |
| Provider/polling managers           | `app/services/providerManagers.test.ts`     | Market-order-log caching, unified-margin empty-bucket updates/reset, notification auto-removal, Pyth subscription/cache cleanup, malformed Pyth payload containment, and monitor failure status changes with fake timers. |
| Browser route smoke                 | `e2e/app-smoke.spec.ts`                     | Real Chromium app boot, lazy route rendering, deterministic provider startup mocks, generated-file independence, and not-found route rendering.                                                                           |

## Major Untested Surfaces

| Risk Area                    | Why It Matters                                                                                          | Missing Proof                                                                                                                                                                 | Smallest Useful Check                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data processors and workers  | Websocket and HTTP data feed most tables and account state.                                             | Node tests now cover core normalization and worker envelopes, but not every sort branch or websocket lifecycle interaction.                                                   | Extend branch coverage around table-specific sorting and add websocket context lifecycle tests separately.                                                                                         |
| Transaction services         | Market, limit, cancel, leverage, deposit, and withdraw services build/send wallet transactions.         | Node tests cover builder/send envelopes and key parameters with mocked builders; they do not prove on-chain instruction correctness.                                          | Add SDK/contract-level transaction fixture checks if the Ember SDK exposes stable instruction decoding fixtures.                                                                                   |
| Session/refreg app effects   | `AppContext` sends connect-wallet referral instructions when sessions establish.                        | Pure gating and duplicate-key helpers are covered; the React effect itself is not mounted in a provider harness.                                                              | Add a future component/provider test once jsdom or a browser harness is deliberately introduced.                                                                                                   |
| Websocket lifecycle          | `WsContext` owns reconnects, subscription routing, ready state, and sleeps/retries.                     | No tests prove reconnect backoff, unsubscribe behavior, message routing, or cleanup on unmount.                                                                               | Add a fake `WebSocket` harness in node or jsdom and test connect, message dispatch to subscribed handler, close-triggered reconnect, and unsubscribe cleanup.                                      |
| TradingView/chart overlays   | Chart lines, y-axis overlay, drag/cancel/edit behavior are core trading UX.                             | Typecheck/build prove compilation only; no browser or canvas interaction checks.                                                                                              | Add a browser smoke harness after Playwright is introduced: open trade route with mocked chart/data, assert overlay canvas renders, drag intent updates state, cancel action calls mocked service. |
| Order input workflow         | Sizing, leverage, reduce-only, TP/SL, market/limit toggles, and validation are core order safety.       | No component or integration tests prove disabled states, edge values, min order checks, or modal confirmation flow.                                                           | Start with pure hook/helper tests where possible; then add component tests for invalid size, unavailable session, max leverage, and confirm button service call.                                   |
| Tables and sorting           | Open orders, positions, fills, funding, TWAP, balances, deposits/withdrawals drive portfolio decisions. | Generic table persistence and row formatting are untested, and mock data drift already caused type failures.                                                                  | Add tests for table sort persistence, empty state, CSV formatting edge cases, and one row-format test per high-value table.                                                                        |
| Routes and navigation        | The app has many route entry points and feature views.                                                  | Browser smoke tests now cover core route rendering and not-found behavior, but not navigation interactions, mobile layout, or route-specific user workflows.                  | Add interaction checks for header navigation, protected/no-wallet states, and mobile route layout.                                                                                                 |
| Provider/live API boundaries | FUUL, info API, Pyth, websocket, and chain RPC calls can spend time/money and fail.                     | FUUL, info API, Pyth, and fixture-level RPC envelopes now have deterministic Node coverage for several failure shapes; websocket/session provider lifecycle remains untested. | Add fake-websocket lifecycle tests and keep any further provider checks mocked or explicitly gated.                                                                                                |

## Recommended Test Branches

1. `review-provider-fixtures`
   Added fixture-backed provider tests for FUUL/referral/info/Pyth paths, with
   fake timers where polling or timeout behavior matters.

2. `review-table-and-form-regressions`
   Cover table sorting/persistence and order input validation edge cases that are
   likely to regress during UI work.

3. `review-tradingview-overlay-smoke`
   Add narrow browser checks for chart script loading, overlay canvas presence,
   and order-line interaction once stable chart fixtures are available.

## CI Recommendation

Keep the current CI gates as the default required checks:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:ci`
- `pnpm test:smoke`
- `pnpm build:prod`

Keep `pnpm test:coverage` diagnostic-only for now. The baseline is low because
coverage includes many hooks, stores, and utilities that are intentionally out
of this node-only branch; adding hard thresholds now would incentivize noisy
coverage work instead of targeted risk coverage.

Keep browser/provider suites as separate workflow steps or jobs so fast unit
tests remain quick and deterministic while slower integration checks can have
their own timeouts and fixtures.

## What This Does Not Prove

- It executes a browser smoke harness, but it does not execute a wallet,
  websocket server, or live chain RPC.
- It does not prove TradingView runtime behavior.
- It does not prove transaction correctness against the real on-chain program.
