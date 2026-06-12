# Validation Foundation Review

This review captures what the repo can prove today before broader frontend,
data-flow, wallet/session, or UI-system work starts.

## Current Branch

- Branch: `review-validation-foundation`
- Base inspected: `develop`
- Runtime used locally: Node `v26.0.0`, pnpm `11.0.0`

## Validation Matrix

| Check                     | Status             | Evidence                                                                               | What It Proves                                                                                                            | What It Does Not Prove                                                                                |
| ------------------------- | ------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Dependency install        | Pass               | `pnpm install --frozen-lockfile`                                                       | The current lockfile installs with pnpm 11 and the approved build-script map on this machine.                             | Does not prove every optional/native package works on all CI platforms.                               |
| Lint                      | Pass with warnings | `pnpm lint`: 0 errors, 249 warnings                                                    | ESLint now exits green and is suitable as a CI gate for the currently enforced rule set.                                  | Does not prove the remaining warning debt is resolved.                                                |
| Typecheck                 | Pass               | `pnpm typecheck`                                                                       | First-party frontend and SDK TypeScript now compile after scoping generated/vendor surfaces.                              | Does not prove excluded TradingView vendor files, server stubs, or runtime behavior.                  |
| Unit tests                | Pass               | `pnpm test:ci`: 12 files, 83 tests passed                                              | Node-only tests now cover utilities, processors, workers, transaction-service envelopes, and provider/polling boundaries. | Does not execute a browser, route renderer, wallet, websocket server, chain RPC, or visual checks.    |
| Coverage diagnostic       | Pass               | `pnpm test:coverage`: statements 27.1%, branches 17.51%, functions 22.05%, lines 27.7% | Coverage reporting works and gives a baseline for future review branches.                                                 | No hard thresholds are enforced yet because major browser/UI surfaces are intentionally out of scope. |
| Browser smoke             | Pass               | `pnpm test:smoke`: 10 Chromium route smoke tests passed                                | The app boots in real Chromium and high-value routes render with deterministic provider mocks.                            | Does not prove wallet flows, chart overlays, visual layout, accessibility completeness, or live APIs. |
| Production frontend build | Pass with warnings | `pnpm --filter frontend build:prod`                                                    | Vite can build the SPA when the TradingView submodule is present.                                                         | Does not prove runtime behavior, TradingView license/access assumptions, or chunk-size acceptability. |

## CI Baseline

The GitHub workflow now runs the checks that are currently green:

- checkout with recursive submodules;
- `pnpm install --frozen-lockfile`;
- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test:ci`;
- `pnpm exec playwright install --with-deps chromium`;
- `pnpm test:smoke`;
- `pnpm build:prod`.

## pnpm 11 Configuration

pnpm 11 no longer reads pnpm settings from the `pnpm` field in `package.json`.
The repo already stores build-script approvals in `pnpm-workspace.yaml`; this
branch also moves dependency overrides there so installs no longer warn that the
root `pnpm.overrides` setting is ignored.

Current approved install-time build scripts:

- `@stellar/stellar-sdk`
- `bigint-buffer`
- `blake-hash`
- `bufferutil`
- `esbuild`
- `protobufjs`
- `sharp`
- `tiny-secp256k1`
- `usb`
- `utf-8-validate`

## Current Failure Buckets

### Typecheck

Initial observed buckets:

- frontend API/type drift around referral code responses;
- table mock/data modules importing non-exported row types;
- strict `verbatimModuleSyntax` type-only import failures, including copied
  TradingView UDF sources;
- chart/d3 namespace typing gaps;
- route/showcase/component prop type mismatches;
- SDK export ambiguity between websocket modules;
- generated/server-only modules missing from plain `tsc`.

These are addressed or scoped in `review-typecheck-scope.md`.

### Lint

Initial observed buckets:

- unused imports and variables;
- broad `any` usage;
- missing `react-hooks/exhaustive-deps` plugin rule definition;
- unused expressions;
- `@ts-ignore` usage where `@ts-expect-error` is required;
- linting generated or third-party-ish TradingView/mock declaration surfaces.

The enforced lint baseline is addressed in `review-eslint-baseline.md`. The
remaining `any` and unused-symbol debt is intentionally warning-level for now.

## Recommended Next Branches

The coverage inventory is captured in `review-test-coverage-map.md`. Recommended
next implementation branches are:

1. `review-provider-fixtures`
   Add fixture-backed provider checks for live API boundaries that are not fully
   covered by the node-only unit mocks.

2. `review-table-and-form-regressions`
   Cover table sorting/persistence and order input validation edge cases.

3. `review-tradingview-overlay-smoke`
   Add browser checks for TradingView script loading, overlay canvas presence,
   and order-line interaction.
