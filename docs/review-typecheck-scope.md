# Typecheck Scope Review

## Overview

This pass turns `pnpm typecheck` from a noisy failing command into a green local
quality gate for first-party frontend and SDK code.

## What Changed

- Scoped generated/vendor-like surfaces out of the frontend `tsconfig`:
  `app/tv/**/*` and `server/**/*`.
- Routed `~/tv/charting_library` imports to the existing local mock declaration
  so app code can typecheck without checking the vendored TradingView package.
- Fixed first-party type drift in referral code consumers, open-order
  processing, notification imports, TWAP table usage, chart drag/cancel code,
  showcase/demo data, and SDK websocket exports.
- Replaced the previous `d3` ambient `any` export with a minimal module shim
  that supports the repo's current chart usage without adding a dependency.

## Why This Scope

The repo currently contains vendored TradingView artifacts and server stubs that
are not maintained like normal app source. Including them in plain `tsc` created
failures that hid actionable app errors. The new scope keeps typecheck focused
on code the team is likely to edit during product work.

## Evidence

- Before scoping/fixes: `pnpm typecheck` reported 120 TypeScript errors.
- After scoping/fixes: `pnpm typecheck` reports 0 TypeScript errors.

## What This Proves

- First-party frontend and SDK TypeScript compile under the current strict
  options.
- The HTTP open-orders processor now accepts the string-number shape returned by
  the API and parses before arithmetic.
- Referral code consumers now read FUUL `codes[0].code`, matching the declared
  response type.

## What This Does Not Prove

- It does not typecheck the excluded TradingView vendor files or `server/**/*`.
- It does not prove the hand-written D3 shim is complete; it only covers current
  usage.
- It does not prove runtime chart behavior, wallet/session behavior, or
  transaction success paths.

## Follow-Up

The next validation branch should make lint useful in the same way: decide the
enforced scope first, then fix or explicitly defer the remaining rule buckets.
