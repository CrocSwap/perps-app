# Review TradingView Overlay Smoke

## Overview

Branch: `review-tradingview-overlay-smoke`

This branch adds a narrow browser smoke layer for the `/v2/trade` TradingView
surface, plus a tiny Node-tested intent helper for chart-line cancel/confirm
decisions. It stays inside the existing Vitest Node and Playwright tooling.

## What Changed

- Added Playwright coverage for local TradingView iframe boot on `/v2/trade`.
- Asserted the main TradingView pane canvas and app-owned overlay canvases are
  present with non-zero dimensions.
- Covered the no-wallet Quick Trade settings open/cancel path from the chart
  frame.
- Extracted pure chart-element cancel/confirm intent helpers and covered preview
  order restore, preview confirm, existing order-line confirm, and noop paths in
  Vitest.

## What The Tests Prove

- The trade route can load the local TradingView bundle under the existing
  provider mocks.
- The app can inject `order-overlay`, `limit-order-placement-overlay`, and
  `y-overlay` canvases into the TradingView iframe after chart readiness.
- The chart header control path can open and dismiss the Quick Trade settings
  surface without a wallet session or runtime fallback.
- The cancel/edit decision path for chart preview and existing order lines is
  deterministic without mounting React.

## What This Does Not Prove

- It does not prove pixel-perfect chart rendering or live TradingView data
  correctness.
- It does not prove on-chain order cancel/edit success.
- It does not prove canvas label hit-testing against every order-line geometry.
- It does not establish a wallet session or sign a transaction.

## Validation

- `pnpm install --frozen-lockfile`: passed.
- `pnpm lint`: passed with 0 errors and 248 existing warnings.
- `pnpm typecheck`: passed.
- `pnpm test:ci`: passed with 16 test files and 102 tests.
- `pnpm test:coverage`: passed with statements 29.12%, branches 18.6%,
  functions 24.08%, and lines 29.64%.
- `pnpm test:smoke`: passed with 15 Chromium tests.
- `pnpm --filter frontend build:prod`: passed with existing Vite/PWA and
  chunk-size warnings.
- `git diff --check`: passed.

## Remaining Gaps

- Fake-websocket lifecycle coverage belongs in
  `review-websocket-session-lifecycle`.
- Mobile/focus/accessibility smoke belongs in `review-accessibility-mobile-smoke`.
- Coverage thresholds remain deferred to `review-ci-coverage-thresholds`.
