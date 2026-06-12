# Review Accessibility Mobile Smoke

## Overview

Branch: `review-accessibility-mobile-smoke`

This branch adds narrow Playwright smoke coverage for keyboard, role, focus,
modal, mobile, and protected no-wallet behavior. It uses only Playwright's
built-in assertions and does not add axe, jsdom, Testing Library, or a new
accessibility framework.

## What Changed

- Added desktop smoke coverage for focusable sign-in, size input, reduce-only
  switch, and header navigation link behavior.
- Added a settings modal smoke check that verifies dialog semantics, visible
  close control, and Escape close behavior.
- Added mobile trade-route checks for the trade tab navigation roles and mobile
  footer Portfolio navigation.
- Added mobile no-wallet protected-state coverage for Portfolio to Trade
  navigation.
- Added deterministic `l2Book` provider fixture data so route smoke checks do
  not leave orderbook/mid-price consumers with empty mocked price levels.

## What The Tests Prove

- Primary no-wallet trade controls can receive keyboard focus where expected.
- Header navigation, mobile footer navigation, and mobile trade tabs are
  reachable through browser-visible roles.
- The settings modal opens as a dialog and closes from Escape.
- Mobile trade and portfolio routes render without global fallback text while
  disconnected from a wallet session.

## What This Does Not Prove

- It is not a full accessibility audit and does not claim WCAG compliance.
- It does not measure color contrast, screen-reader output quality, or
  pixel-perfect mobile layout.
- It does not cover a connected wallet session, live signing, or authenticated
  modals.
- Screenshots/videos/traces are diagnostic artifacts from Playwright failures
  only, not approval artifacts.

## Validation

- `pnpm install --frozen-lockfile`: passed.
- `pnpm lint`: passed with 0 errors and 239 existing warnings.
- `pnpm typecheck`: passed.
- `pnpm test:ci`: passed with 17 test files and 109 tests.
- `pnpm test:coverage`: passed with statements 29.12%, branches 18.6%,
  functions 24.08%, and lines 29.64%.
- `pnpm test:smoke`: passed with 21 Chromium tests.
- `pnpm --filter frontend build:prod`: passed with existing Vite/PWA and
  chunk-size warnings.
- `git diff --check`: passed.

## Remaining Gaps

- Coverage thresholds remain deferred to `review-ci-coverage-thresholds`.
- Deeper accessibility checks, contrast checks, and assistive-technology review
  should be explicitly scoped as a separate audit.
