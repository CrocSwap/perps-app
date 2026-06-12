# Browser Smoke Harness Review

## Overview

This branch adds the first source-controlled browser/runtime validation layer for
`perps-app`. It uses Playwright Chromium smoke tests with deterministic provider
mocks to prove that high-value routes render inside the real Vite app shell
without generated runtime files, live provider calls, wallet connections, chain
RPC, or websocket servers.

This is intentionally not a full E2E suite. It does not assert trading
correctness, visual layout quality, wallet flows, TradingView canvas behavior, or
accessibility coverage beyond the roles used for smoke assertions.

## Branch

- Branch: `review-browser-smoke-harness`
- Base: current validation-foundation and node-validation-suite work
- Browser runner: Playwright `@playwright/test`
- Browser project: Chromium desktop
- Command: `pnpm test:smoke`

## What Changed

- Added `@playwright/test` as a direct frontend dev dependency.
- Added root and frontend `test:smoke` scripts.
- Added `packages/frontend/playwright.config.ts` with a managed Vite dev server
  on port `3002`.
- Added `packages/frontend/e2e/fixtures.ts` for deterministic browser boot
  mocks:
    - local generated files: `/version.json`, `/announcements.json`;
    - restricted-country Netlify function;
    - Hyperliquid info/market payloads;
    - FUUL referral endpoints;
    - Pyth Hermes latest-price payloads;
    - Fogo RPC JSON-RPC envelope;
    - fake `WebSocket` startup.
- Added `packages/frontend/e2e/app-smoke.spec.ts` covering route-level render
  smoke checks.
- Added Playwright reports/artifacts to `.gitignore`.
- Added Playwright browser install and `pnpm test:smoke` to the frontend
  validation workflow.

## Covered Routes

The smoke suite currently opens these routes through the real browser app shell:

- `/`
- `/v2/trade`
- `/v2/portfolio`
- `/v2/referrals`
- `/v2/vaults`
- `/v2/agents`
- `/v2/more`
- `/v2/privacy`
- `/v2/terms`
- `/v2/definitely-not-a-real-route`

Each route asserts that visible main content appears and that the global error
fallback text is absent.

## Current Evidence

| Check                                             | Result                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                  | Pass                                                                   |
| `pnpm --filter @perps-app/frontend lint`          | Pass with existing warning baseline: 0 errors, 249 warnings            |
| `pnpm --filter @perps-app/frontend typecheck`     | Pass                                                                   |
| `pnpm --filter @perps-app/frontend test:ci`       | 12 files, 83 tests passing                                             |
| `pnpm --filter @perps-app/frontend test:coverage` | Pass; statements 27.1%, branches 17.51%, functions 22.05%, lines 27.7% |
| `pnpm --filter @perps-app/frontend test:smoke`    | 10 Chromium smoke tests passing                                        |
| `pnpm --filter @perps-app/frontend build:prod`    | Pass with existing Vite/Rollup dependency and chunk-size warnings      |

## What This Proves

- The app can boot in a real Chromium browser through the Vite dev server.
- High-value route modules can lazy-load and render under the normal provider
  tree.
- Generated local runtime files are no longer required for smoke validation.
- Provider boot calls can be mocked without live FUUL, Hyperliquid, Pyth, Fogo
  RPC, or websocket access.
- The not-found route renders through the same app shell.

## What This Does Not Prove

- It does not prove wallet login, transaction signing, or on-chain behavior.
- It does not prove TradingView chart rendering, overlay canvas interaction, or
  order-line behavior.
- It does not prove responsive layout, visual polish, accessibility completeness,
  or keyboard workflows.
- It does not prove provider retry/rate-limit behavior or live API contracts.
- It does not fail on existing console warning noise that is unrelated to route
  render liveness.

## Follow-Up Review Branches

1. `review-provider-fixtures`
   Deepen provider fixtures around FUUL/referral/info/Pyth timeout, malformed
   payload, rate-limit, and retry behavior.

2. `review-table-and-form-regressions`
   Cover table sorting/persistence and order input validation through focused
   component or browser checks.

3. `review-tradingview-overlay-smoke`
   Add a narrow browser suite for chart script loading, overlay canvas presence,
   and order-line interaction once stable chart fixtures are available.
