# Review Provider Fixtures

## Overview

Branch: `review-provider-fixtures`

This branch adds deterministic provider-boundary fixtures and Node tests for
FUUL/referral APIs, Hyperliquid info payloads, Pyth price polling, and Fogo RPC
envelope shape. It keeps all provider tests mocked in Vitest's `node`
environment and does not add MSW, jsdom, Testing Library, axe, or any live
network calls.

## What Changed

- Added reusable fetch helpers in `packages/frontend/app/test-utils/fetch.ts`
  for JSON response fixtures and ordered fetch response sequences.
- Added provider fixture helpers in
  `packages/frontend/app/test-utils/providerFixtures.ts` for FUUL referrers,
  affiliate-code responses, Pyth price updates, Hyperliquid spot/token payloads,
  and Fogo JSON-RPC envelopes.
- Hardened `ReferralStore` FUUL calls with a timeout-aware JSON fetch helper,
  non-OK rejection, per-program referrer fallback, malformed referrer
  normalization, and safer claim payload normalization.
- Hardened `useInfoApi().fetchTokenId` so malformed spot metadata returns an
  empty token id instead of throwing.
- Added provider-boundary tests for:
    - FUUL affiliate-code success and non-OK responses.
    - FUUL referrer malformed payloads, empty payloads, thrown fetches, timeout
      fallback, and rate-limit-style non-OK responses.
    - Claims empty-address short-circuiting, fetch failure fallback, and unexpected
      payload normalization.
    - Hyperliquid BTC-to-UBTC spot metadata mapping, malformed spot metadata, and
      token detail numeric parsing.
    - Pyth malformed payload containment and monitor failure status transitions.
    - Fogo JSON-RPC fixture envelope shape.
- Added the root `pnpm test:coverage` alias so the documented validation command
  works from the workspace root.

## What The Tests Prove

- FUUL referrer/provider failures are contained per request/program and do not
  reject the whole conversion check when one program fails.
- FUUL referrer responses are normalized before conversion logic reads them.
- FUUL claim state remains an array or `null`; malformed provider bodies do not
  store arbitrary object shapes as claims.
- Hyperliquid spot metadata parsing tolerates missing `tokens`.
- Hyperliquid token detail numeric strings still normalize to numbers.
- Pyth malformed price payloads are caught without notifying subscribers or
  writing cache entries.
- Pyth monitor failures can mark the service disconnected under fake timers.
- Fogo RPC fixtures have a stable JSON-RPC envelope for later chain-boundary
  tests.

## What This Does Not Prove

- It does not call live FUUL, Hyperliquid, Pyth, or Fogo providers.
- It does not prove provider availability, current upstream schema correctness,
  rate-limit policy, or paid/live RPC behavior.
- It does not prove wallet login, signing, websocket session establishment, or
  on-chain transaction correctness.
- It does not add browser, visual, accessibility, or component-rendering tests.

## Validation

- `pnpm install --frozen-lockfile`: passed.
- `pnpm lint`: passed with 0 errors and the existing 249-warning baseline.
- `pnpm typecheck`: passed.
- `pnpm test:ci`: passed, 13 test files and 93 tests.
- `pnpm test:coverage`: passed, 13 test files and 93 tests. Coverage baseline:
  statements 28.86%, branches 18.52%, functions 23.5%, lines 29.42%.
- `pnpm test:smoke`: passed, 10 Chromium route-smoke tests.
- `pnpm --filter frontend build:prod`: passed with existing Vite/PWA/chunk-size
  warnings.
- `git diff --check`: passed.

## Remaining Gaps

- Table sorting, persisted sort state, row formatting, and order form validation
  belong in `review-table-and-form-regressions`.
- TradingView overlay readiness and safe order-line intent checks belong in
  `review-tradingview-overlay-smoke`.
- `WsContext` fake-websocket lifecycle coverage belongs in
  `review-websocket-session-lifecycle`.
- Mobile/accessibility smoke checks belong in
  `review-accessibility-mobile-smoke`.
- Coverage thresholds remain deferred to `review-ci-coverage-thresholds`.
