# Review Websocket Session Lifecycle

## Overview

Branch: `review-websocket-session-lifecycle`

This branch adds deterministic websocket lifecycle coverage without a live
websocket server, wallet login, signing, or chain calls. The production
`WsContext` now delegates its socket behavior to a small Node-testable lifecycle
controller.

## What Changed

- Extracted `WsLifecycleController` from `WsContext` for fake-WebSocket Node
  tests.
- Added Vitest coverage for connect/open, subscribe and message dispatch,
  single-subscription replacement, unsubscribe, channel cleanup,
  close-triggered reconnect, offline/tab-active reconnect deferral, force
  reconnect, sleep-mode suppression, and cleanup.
- Added Playwright no-wallet smoke checks for trade and referrals route boot
  behavior.

## What The Tests Prove

- Websocket subscriptions send the expected subscribe/unsubscribe envelopes.
- Handlers receive only matching channel payloads and are suppressed in sleep
  mode.
- Single subscriptions replace prior subscribers and send cleanup for the
  replaced payload.
- Reconnects are scheduled with fake timers and are deferred while offline or
  inactive.
- No-wallet trade/referrals routes boot without global runtime fallback or
  accidental refreg execution text.

## What This Does Not Prove

- It does not connect to the real websocket endpoint.
- It does not prove live provider payload compatibility beyond the tested
  envelope shape.
- It does not establish a wallet session, sign, or submit a transaction.
- It does not prove every websocket consumer renders the processed payload.

## Validation

- `pnpm install --frozen-lockfile`: passed.
- `pnpm lint`: passed with 0 errors and 239 existing warnings.
- `pnpm typecheck`: passed.
- `pnpm test:ci`: passed with 17 test files and 109 tests.
- `pnpm test:coverage`: passed with statements 29.12%, branches 18.6%,
  functions 24.08%, and lines 29.64%.
- `pnpm test:smoke`: passed with 17 Chromium tests.
- `pnpm --filter frontend build:prod`: passed with existing Vite/PWA and
  chunk-size warnings.
- `git diff --check`: passed.

## Remaining Gaps

- Mobile/focus/accessibility smoke belongs in `review-accessibility-mobile-smoke`.
- Coverage thresholds remain deferred to `review-ci-coverage-thresholds`.
