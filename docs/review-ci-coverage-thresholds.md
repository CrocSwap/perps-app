# Review CI Coverage Thresholds

## Overview

Branch: `review-ci-coverage-thresholds`

This branch rebases the final validation track and keeps coverage diagnostic
instead of enforcing hard thresholds. The current baseline is useful for trend
tracking, but it is not yet broad enough to make thresholds a reliable quality
gate without encouraging noisy coverage work.

## What Changed

- Split frontend CI into a fast Node/build job and a separate browser smoke job.
- Added `pnpm test:coverage` to the fast CI job as a diagnostic validation step.
- Kept Vitest in the `node` environment.
- Deferred hard coverage thresholds because the current included baseline still
  has many intentionally untested hooks, stores, and UI-adjacent utilities.

## Current Baseline

- Vitest: 17 test files and 109 tests.
- Coverage: statements 29.12%, branches 18.6%, functions 24.08%, lines 29.64%.
- Playwright: 21 Chromium smoke tests.

## What This Proves

- CI now separates quick deterministic Node/build failures from slower browser
  smoke failures.
- Coverage reporting runs in CI and will catch broken coverage instrumentation
  or test failures.
- Browser smoke remains a distinct step, making route/UI smoke failures easier
  to identify.

## What This Does Not Prove

- It does not enforce coverage percentage thresholds yet.
- It does not make browser smoke a full accessibility, wallet, or visual
  regression suite.
- It does not prove live provider availability, live websocket compatibility,
  wallet signing, or on-chain transaction correctness.

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

## Threshold Decision

Thresholds remain deferred. The baseline is now stable enough to record, but not
yet meaningful enough to enforce because broad included areas still sit near
zero coverage. A useful threshold pass should follow focused coverage for the
highest-value hooks/stores/consumer render paths or narrow the include set to a
more intentionally owned contract.
