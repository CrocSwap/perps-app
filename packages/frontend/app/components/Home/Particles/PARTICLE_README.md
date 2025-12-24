# Particles Subsystem Overview

Reference guide for the particle animation stack under `src/components/Home/Particles/`.

## Responsibilities

- **Preset selection** The `Particles` component chooses a preset + display mode based on the active `preset` prop and device breakpoint, using `resolveMode()`.
- **Responsive sizing** Hooks compute responsive configs (dot counts, container size, mobile overrides) and resize the `<canvas>` element.
- **Animation loop** Dots are updated and drawn each frame using cached preset logic, visibility checks, and a centralized lifecycle controller.
- **Transitions** Smooth preset changes reuse cached initial positions, manage fade-ins, and reinitialize motion when effective layout changes.

## Component Flow (`Particles.tsx`)

1. Resolve display and effective mode via `resolveMode()`.
2. Acquire dot helpers from `useDotPositions()` (initialize, update, cache positions).
3. Build canvas rendering helpers via `useCanvasRenderer()`.
4. Initialize refs (`canvasRef`, `animationRef`, `responsiveConfigRef`).
5. Create a transition controller with `usePresetTransitionController()`; expose state refs and setters.
6. Feed these into `useParticleResponsiveConfig()` to handle canvas sizing and preset seeding.
7. Track visibility with `useParticleVisibility()` so off-screen canvases skip work.
8. `useEffect` reacts to `preset` changes, updating transition state and clearing cached positions when effective layout changes.
9. `useParticleLifecycle()` orchestrates resize handling, animation frames, fade-ins, and transitions.
10. Render the `<canvas>` with classNames derived from responsive mode; optionally show debug overlay when provided.

## Hooks & Modules

- **`useDotPositions()`**
    - Manages dot arrays (`dotsRef`) and cached initial positions per preset/responsive state.
    - Exposes `initializeDots`, `calculateInitialPositions`, `initializePresetMovement`, `updateDots`, and helpers for container centers.
    - Imports individual preset modules from `presets/` and delegates to them.

- **`useCanvasRenderer()`**
    - Provides `draw()` to batch-render dots by color/size and manage fade-in opacity.
    - Exposes `startFadeIn()` to begin the fade timeline.

- **`useParticleResponsiveConfig()`**
    - Measures the canvas via `ResizeObserver`/window resize listeners.
    - Computes a `ResponsiveConfig` using `createResponsiveConfig()` and clears cached positions when layout changes.
    - Initializes dots, positions, and preset movement whenever dimensions or dot counts shift.
    - Optionally returns `debugRect` for layout debugging.

- **`useParticleLifecycle()`**
    - Requests animation frames, skipping updates if the canvas is off-screen (`useParticleVisibility()`).
    - Applies preset updates each frame, runs `draw()`, and restarts fade-ins on load transitions.
    - Reacts to preset/mode changes by recalculating responsive config and reinitializing preset movement.

- **`usePresetTransitionController()`**
    - Stores transition state (`preset`, `displayMode`, `effectiveMode`, timestamps) and keeps refs in sync for other hooks.
    - Offers `setPreset`, `setModes`, `markFadeInStart`, `markTransitionStart`, and `completeInitialLoad` helpers.

- **`useParticleVisibility()`**
    - Lightweight intersection observer that toggles an `isVisibleRef` used by the lifecycle hook.

- **`presets/` modules**
    - Each preset (`hero.ts`, `speed.ts`, `fees.ts`, `mev.ts`, `vault.ts`, `links.ts`) exports:
        - `calculatePositions(width, height, center, responsive)`
        - `initializeMovement(dots, positions, width, height, center, responsive)`
        - `update(dots, width, height, center, responsive, refs?)`
    - Shared types/constants (e.g., `ResponsiveConfig`, `LERP_SPEED_*`, `COLORS`) live in `presets/types.ts`.
    - Math helpers (noise, wave calculations, pool orbits, etc.) live in `presets/utils/`.

## Data Flow Summary

- `Particles` receives `preset` from `Home`.
- `resolveMode()` determines display + effective modes (handles mobile overrides).
- `usePresetTransitionController()` stores state and exposes refs for other hooks.
- `useParticleResponsiveConfig()` measures the canvas, updates responsive config, and seeds dot positions/movement.
- `useParticleLifecycle()` kicks off the animation loop: update dots via current preset, draw via `useCanvasRenderer()`, reschedule frames.
- When preset or effective mode changes:
    - Cached positions may be cleared.
    - Responsive config recalculates.
    - Preset movement reinitializes and fade-in restarts.

## Debugging Tips

- Enable the debug overlay in `Particles.tsx` by checking `debugOverlayNode` logic; ensure `debugRect` is produced by `useParticleResponsiveConfig()`.
- Log outputs inside preset modules to verify position caches (`initialPositionsRef`) and movement updates.
- Use browser devtools to inspect the `<canvas>` sizing—mis-sized canvases often stem from responsive config not running (check resize observers).
