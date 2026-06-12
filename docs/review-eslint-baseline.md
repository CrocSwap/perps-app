# ESLint Baseline Review

## Overview

This pass turns `pnpm lint` into a green, enforceable frontend validation check
without pretending the existing lint debt is already gone.

## What Changed

- Kept ESLint scoped to frontend app source and the existing `app/tv/**` ignore.
- Downgraded the two dominant migration-debt rules to warnings:
  `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars`.
- Allowed short-circuit and ternary expressions for
  `@typescript-eslint/no-unused-expressions`, matching patterns already used in
  the app.
- Allowed empty context interfaces so placeholder React context types do not
  block lint.
- Fixed the remaining hard errors: stale `@ts-ignore`, unnecessary catch wrapper,
  regex escapes, a comma-expression callback, a missing hooks-plugin disable
  reference, and a `prefer-const` violation.
- Added `pnpm lint` and `pnpm typecheck` to the frontend validation workflow.

## Evidence

- Before the pass: `pnpm lint` reported 279 errors.
- After the pass: `pnpm lint` reports 0 errors and 249 warnings.

## What This Proves

- ESLint now exits successfully and can run in CI.
- The remaining lint debt is visible in logs without blocking unrelated review
  work.
- Hard-error lint rules now catch a smaller set of issues that the repo is ready
  to enforce.

## What This Does Not Prove

- It does not mean the remaining 249 warnings are acceptable forever.
- It does not enforce `no-explicit-any` or unused-variable cleanup yet.
- It does not enforce React hooks dependency linting; the repo does not currently
  include `eslint-plugin-react-hooks`.

## Follow-Up

Use future cleanup branches to burn down warning buckets deliberately:

1. Replace broad `any` use in shared components, chart code, services, and tests.
2. Remove or underscore unused imports, variables, and caught errors.
3. Decide whether to add `eslint-plugin-react-hooks` and enforce hooks rules.
