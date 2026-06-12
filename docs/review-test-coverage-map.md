# Test Coverage Map

## Overview

The current test suite now covers the first fast validation layer for the perps
app: referral/refreg utilities, deterministic data processors, worker message
normalization, transaction-service envelopes, provider fetch boundaries, and
polling/notification managers. The repo now also has a narrow Playwright
Chromium smoke layer for route rendering, guarded no-wallet form states,
TradingView overlay boot, and disconnected session behavior through the real
browser app shell. Live wallet flows, real provider availability, and
pixel-perfect chart correctness remain outside the current coverage.

## Current Test Harness

- Runner: Vitest.
- Config: `packages/frontend/vitest.config.ts`.
- Environment: `node`.
- Include pattern: `app/**/*.test.{ts,tsx}`.
- CI command: `pnpm test:ci`.
- Coverage command: `pnpm test:coverage`.
- Current result: 17 test files, 109 tests passing.
- Current coverage baseline: statements 29.12%, branches 18.6%, functions
  24.08%, lines 29.64%.

The repo now declares `@vitest/coverage-v8` as a direct frontend dev dependency.
It still does not declare Testing Library, jsdom/happy-dom, or MSW.

## Current Browser Smoke Harness

- Runner: Playwright.
- Config: `packages/frontend/playwright.config.ts`.
- Browser project: Chromium desktop.
- Test directory: `packages/frontend/e2e`.
- Command: `pnpm test:smoke`.
- Current result: 17 Chromium smoke tests passing.
- Current route set: `/`, `/v2/trade`, `/v2/portfolio`, `/v2/referrals`,
  `/v2/vaults`, `/v2/agents`, `/v2/more`, `/v2/privacy`, `/v2/terms`, and a
  not-found route.

## What Is Covered

| Area                                | Files                                                                                                                        | What It Proves                                                                                                                                                                                                            |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Referral store cache and migrations | `app/stores/ReferralStore.test.ts`                                                                                           | Cache approval rules, migration normalization, and protection against passive URL overwrites.                                                                                                                             |
| Referral provider boundaries        | `app/stores/ReferralStore.provider.test.ts`                                                                                  | Affiliate-code fetch success/failure, conversion checks across Fuul programs, persisted conversion short-circuiting, malformed payloads, non-OK responses, timeouts, and claims fallback behavior.                        |
| Info/provider fixtures              | `app/hooks/useInfoApi.provider.test.ts`                                                                                      | Hyperliquid spot/token payload parsing, malformed spot metadata fallback, token detail numeric conversion, and Fogo JSON-RPC fixture envelope shape.                                                                      |
| Referral/refreg instruction helpers | `app/utils/refreg.test.ts`                                                                                                   | Instruction tags, byte layouts, PDA derivation, referral kind detection, localStorage reads, send sequencing, failure continuation, and attributed-count fetch query construction.                                        |
| App refreg gating                   | `app/contexts/AppContext.test.ts`                                                                                            | The connect-wallet referral flow only runs when the session, sender, wallet/session keys, payer, cached code, and invitee approval are present.                                                                           |
| Explorer tx links                   | `app/utils/Constants.test.ts`                                                                                                | `getTxLink` handles empty signatures, testnet/mainnet URL shape, and custom explorer envs.                                                                                                                                |
| Market ID lookup                    | `app/utils/marketIdToName.test.ts`                                                                                           | BTC market ID lookup across bigint/number/string inputs and fallback behavior for invalid or unknown inputs.                                                                                                              |
| Data processors                     | `app/processors/*.test.ts`                                                                                                   | Order book totals/ratios, trade side mapping, user order normalization, positions, symbol info, balances, fills, TWAP, funding, deposit/withdrawal, and vault normalization.                                              |
| Worker message handlers             | `app/hooks/workers/*.test.ts`                                                                                                | `orderbook.worker` and `webdata2.worker` output shapes for fixture messages and error envelopes for malformed messages.                                                                                                   |
| Transaction services                | `app/services/transactionServices.test.ts`                                                                                   | Limit/market/cancel/margin/deposit/withdraw success and failure envelopes, mocked builder parameters, instruction forwarding, scaling, and refreg follow-up triggers.                                                     |
| Provider/polling managers           | `app/services/providerManagers.test.ts`                                                                                      | Market-order-log caching, unified-margin empty-bucket updates/reset, notification auto-removal, Pyth subscription/cache cleanup, malformed Pyth payload containment, and monitor failure status changes with fake timers. |
| Browser route smoke                 | `e2e/app-smoke.spec.ts`                                                                                                      | Real Chromium app boot, lazy route rendering, deterministic provider startup mocks, generated-file independence, and not-found route rendering.                                                                           |
| Table/form regressions              | `app/components/Tables/GenericTable/*.test.ts`, `app/stores/useTableSortStore.test.ts`, `e2e/table-form-regressions.spec.ts` | Sort-cycle helpers, table empty/loading/filled decisions, CSV cell formatting, persisted sort entries, no-wallet trade form guards, reduce-only safe default state, and protected portfolio state.                        |
| TradingView overlay smoke           | `app/routes/chart/orders/component/chartElementControlIntent.test.ts`, `e2e/tradingview-overlay-smoke.spec.ts`               | Local TradingView iframe boot, pane canvas readiness, app overlay canvas injection, Quick Trade chart-control open/cancel behavior, and pure chart-line cancel/confirm intent decisions.                                  |
| Websocket/session lifecycle         | `app/contexts/wsLifecycle.test.ts`, `e2e/websocket-session-lifecycle.spec.ts`                                                | Fake-WebSocket connect/subscribe/dispatch/reconnect/unsubscribe behavior, offline/tab-active deferral, sleep-mode suppression, cleanup, and no-wallet session route boot.                                                 |

## Major Untested Surfaces

| Risk Area                    | Why It Matters                                                                                          | Missing Proof                                                                                                                                                                   | Smallest Useful Check                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Data processors and workers  | Websocket and HTTP data feed most tables and account state.                                             | Node tests cover core normalization, worker envelopes, and websocket lifecycle routing, but not every consumer render path fed by those payloads.                               | Add consumer-level checks for the highest-value websocket-fed tables if a future browser/component harness is intentionally introduced. |
| Transaction services         | Market, limit, cancel, leverage, deposit, and withdraw services build/send wallet transactions.         | Node tests cover builder/send envelopes and key parameters with mocked builders; they do not prove on-chain instruction correctness.                                            | Add SDK/contract-level transaction fixture checks if the Ember SDK exposes stable instruction decoding fixtures.                        |
| Session/refreg app effects   | `AppContext` sends connect-wallet referral instructions when sessions establish.                        | Pure gating and duplicate-key helpers are covered; the React effect itself is not mounted in a provider harness.                                                                | Add a future component/provider test once jsdom or a browser harness is deliberately introduced.                                        |
| Websocket lifecycle          | `WsContext` owns reconnects, subscription routing, ready state, and sleeps/retries.                     | Fake-WebSocket tests now cover lifecycle envelopes, routing, reconnect deferral, and cleanup, but not live websocket payload compatibility or every consumer render path.       | Add consumer-level checks for the highest-value websocket-fed tables if a future browser/component harness is intentionally introduced. |
| TradingView/chart overlays   | Chart lines, y-axis overlay, drag/cancel/edit behavior are core trading UX.                             | Browser smoke proves local iframe/canvas/overlay boot and one safe chart-control path, but not pixel-perfect rendering, drag behavior, or live TradingView data correctness.    | Add deeper chart interaction checks only when a stable mocked chart API path exists for drag/edit behavior.                             |
| Order input workflow         | Sizing, leverage, reduce-only, TP/SL, market/limit toggles, and validation are core order safety.       | Browser smoke now covers guarded no-wallet form state and reduce-only defaults, but not wallet-enabled confirmation, live best-bid/ask changes, or real signing.                | Add wallet/session-enabled order-flow checks only after a deterministic wallet/signing harness exists.                                  |
| Tables and sorting           | Open orders, positions, fills, funding, TWAP, balances, deposits/withdrawals drive portfolio decisions. | Generic table sorting, persistence, empty-state decisions, and CSV formatting helpers are covered; individual high-value table row renderers are still not exhaustively tested. | Add one focused row-format test per high-value table when touching those table modules.                                                 |
| Routes and navigation        | The app has many route entry points and feature views.                                                  | Browser smoke tests now cover core route rendering and not-found behavior, but not navigation interactions, mobile layout, or route-specific user workflows.                    | Add interaction checks for header navigation, protected/no-wallet states, and mobile route layout.                                      |
| Provider/live API boundaries | FUUL, info API, Pyth, websocket, and chain RPC calls can spend time/money and fail.                     | FUUL, info API, Pyth, fixture-level RPC envelopes, and websocket lifecycle behavior have deterministic coverage; live provider availability remains intentionally unproven.     | Keep any future provider checks mocked or explicitly gated from default CI.                                                             |

## Recommended Test Branches

1. `review-provider-fixtures`
   Added fixture-backed provider tests for FUUL/referral/info/Pyth paths, with
   fake timers where polling or timeout behavior matters.

2. `review-table-and-form-regressions`
   Added focused table helper/store tests and browser smoke checks for
   no-wallet order form and protected table states.

3. `review-tradingview-overlay-smoke`
   Added narrow browser checks for local TradingView boot, overlay canvas
   presence, and a safe chart-control interaction path, plus Node coverage for
   chart-line cancel/confirm intent decisions.

4. `review-websocket-session-lifecycle`
   Added fake-WebSocket lifecycle coverage plus disconnected trade/referrals
   browser smoke checks.

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
- It proves only narrow local TradingView smoke behavior, not live TradingView
  data correctness or pixel-perfect rendering.
- It does not prove transaction correctness against the real on-chain program.
