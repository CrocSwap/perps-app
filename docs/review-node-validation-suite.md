# Node Validation Suite Review

## Overview

This branch expands the validation foundation into a fast, deterministic
node-only suite. It does not introduce browser rendering, jsdom, Testing Library,
Playwright, MSW, wallet connections, websocket servers, or live chain/provider
calls.

## Branch

- Branch: `review-node-validation-suite`
- Base: current `review-validation-foundation` work
- Test environment: Vitest `node`

## What Changed

- Added `@vitest/coverage-v8` and `pnpm test:coverage` for diagnostic coverage
  reports without hard thresholds.
- Added shared test helpers for deterministic Solana keys/instructions, fetch
  stubbing, and fake worker-module loading.
- Added a pure connect-wallet refreg gate helper so session/referral skip
  decisions are testable without mounting React.
- Added node tests for processors, workers, transaction services, referral
  provider calls, polling managers, notification timers, and Pyth subscription
  cleanup.

## Current Evidence

| Check                                             | Result                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `pnpm --filter @perps-app/frontend test:ci`       | 12 files, 83 tests passing                                             |
| `pnpm --filter @perps-app/frontend test:coverage` | Pass; statements 27.1%, branches 17.51%, functions 22.05%, lines 27.7% |
| `pnpm --filter @perps-app/frontend typecheck`     | Pass                                                                   |
| `pnpm --filter @perps-app/frontend lint`          | Pass with existing warning baseline                                    |

## Remaining Gaps

- Browser route rendering, TradingView overlays, responsive layout, and visual
  behavior remain untested.
- Transaction-service tests prove local parameters and result envelopes with
  mocked builders; they do not prove on-chain instruction correctness.
- Websocket worker message handlers are tested, but `WsContext` reconnect,
  subscription, and cleanup behavior still need a dedicated harness.
- Coverage is intentionally diagnostic-only until browser/UI and provider
  fixture suites exist.
