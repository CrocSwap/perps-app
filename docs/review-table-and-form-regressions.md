# Review Table And Form Regressions

## Overview

Branch: `review-table-and-form-regressions`

This branch adds deterministic regression coverage for high-risk table and order
form behavior without adding jsdom, Testing Library, MSW, axe, or a new browser
framework. Pure table logic is covered in Vitest `node`; live browser behavior
is covered through the existing Playwright smoke harness and provider mocks.

## What Changed

- Extracted small pure `GenericTable` helpers for sort cycling, table state
  selection, and CSV cell formatting.
- Added Vitest coverage for:
    - sort state cycling through descending, ascending, and unset;
    - loading, empty, and filled table-state decisions;
    - CSV formatting for nulls, numbers, numeric strings, currencies, dates, and
      plain strings;
    - persisted table-sort store entries by table id.
- Added Playwright coverage for:
    - no-wallet trade route form guard state;
    - visible size/leverage/reduce-only controls;
    - reduce-only safe default state;
    - disconnected portfolio protected state.

## What The Tests Prove

- Table sort state transitions remain deterministic and reset after the third
  click on the same key.
- Empty/loading/filled table states do not depend on React rendering to verify.
- CSV-ish cell formatting keeps currency/date-like strings safe for spreadsheet
  consumers.
- Persisted table sort entries remain scoped per table id.
- In Chromium with provider mocks, the trade route renders order controls, keeps
  reduce-only off by default, and withholds submit capability from a no-wallet
  session.
- The portfolio route keeps its protected no-wallet state instead of rendering a
  runtime fallback.

## What This Does Not Prove

- It does not mount `GenericTable` in a component test harness.
- It does not prove every table row component or every table sort branch.
- It does not establish a wallet session, submit an order, or sign a
  transaction.
- It does not prove keyboard accessibility for every order-form control; that is
  deferred to `review-accessibility-mobile-smoke`.

## Validation

- `pnpm install --frozen-lockfile`: passed.
- `pnpm lint`: passed with 0 errors and 248 existing warnings.
- `pnpm typecheck`: passed.
- `pnpm test:ci`: passed with 15 test files and 98 tests.
- `pnpm test:coverage`: passed with statements 29.12%, branches 18.6%,
  functions 24.08%, and lines 29.64%.
- `pnpm test:smoke`: passed locally with 13 Chromium tests.
- `pnpm --filter frontend build:prod`: passed with existing Vite/PWA and
  chunk-size warnings.
- `git diff --check`: passed.

## Remaining Gaps

- TradingView chart readiness and order-line smoke belong in
  `review-tradingview-overlay-smoke`.
- Fake-websocket lifecycle coverage belongs in
  `review-websocket-session-lifecycle`.
- Mobile/focus/accessibility smoke belongs in `review-accessibility-mobile-smoke`.
- Coverage thresholds remain deferred to `review-ci-coverage-thresholds`.
