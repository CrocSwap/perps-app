# Animated Dots Module

## Overview

`Particles/` renders the dynamic canvas background for the Home overlay. It morphs between preset-specific dot formations as the active slide changes, with responsive layouts for desktop and mobile.

## Structure

```
Particles/
├── Particles.tsx           # Main React component managing canvas lifecycle
├── Particles.module.css    # Canvas positioning/layout classes
├── mode.ts                     # Maps `PresetId` + device to display mode (fullscreen/right-side/bottom)
├── hooks/
│   ├── use-canvas-renderer.ts  # Batched 2D canvas rendering and fade-in effects
│   └── use-dot-positions.ts    # Calculates initial positions and updates for each preset
└── presets/
    ├── hero.ts, speed.ts, ...  # Preset-specific `calculatePositions`, `initializeMovement`, `update` logic
    └── types.ts                # Shared interfaces for dots, responsive config, utility helpers
```

## Data Flow

1. `AnimatedDots` receives the current `preset` (`PresetId`) from `Home.tsx`.
2. `resolveMode` combines the preset with `useIsMobile()` to determine a `DotFieldMode` (`fullscreen`, `right-side`, `bottom`).
3. `useDotPositions()` returns reusable hooks for initializing dot arrays, computing positions, and updating them per frame. It dynamically imports the preset module (`hero`, `speed`, etc.).
4. `useCanvasRenderer()` provides `draw` and `startFadeIn` to render dots efficiently with grouped fill operations.
5. The component manages canvas resizing, responsive breakpoints, and animation frames (`requestAnimationFrame`), caching initial positions to smooth transitions.

## Key Concepts

- **Responsive Config** (`preset/types.ts`): Determines dot counts and layout parameters based on canvas size and device type.
- **Preset Modules**: Each preset exports `calculatePositions`, `initializeMovement`, and `update`. These functions control where dots appear and how they animate.
- **Mode Handling**: Modes adjust canvas placement; e.g., hero/links use fullscreen, while other presets may move dots to the right side or bottom on mobile.
- **Visibility Optimization**: An `IntersectionObserver` pauses animation when the canvas is off screen.

## Extending Presets

To add a new animated preset:

- Create `presets/newPreset.ts` implementing the `PresetDefinition` interface (`calculatePositions`, etc.).
- Import it in `use-dot-positions.ts` and extend the `PRESETS` map.
- Update `resolveMode` if the preset should use a unique display mode.
- Ensure `ResponsiveConfig` supports your dot counts/layout needs.

## Hooks Summary

- `use-dot-positions.ts`:
    - `initializeDots(width, height, responsive, mode)`
    - `calculateInitialPositions(preset, width, height, responsive, mode)`
    - `initializePresetMovement(...)`
    - `updateDots(...)`
    - Shares `dotsRef`, `initialPositionsRef`, and optional preset-specific state.
- `use-canvas-renderer.ts`:
    - Returns `draw(ctx, width, height, dots)` and `startFadeIn()` to animate opacity.
    - Performs batched drawing for performance and handles global alpha adjustments.

## Styling

`Particles.module.css` contains classes that position the canvas depending on mode:

- `.canvas` – fullscreen default
- `.canvasRightSide` – desktop right-aligned mode
- `.canvasBottom` – bottom-aligned layout for mobile/fallback

## Integration Notes

- `AnimatedDots` should be layered underneath overlay content. Ensure parent layout handles stacking (`z-index` vs overlay).
- Canvas size syncs to its container. When embedding elsewhere, keep the container positioned absolute/fixed to cover the target area.
- The component assumes the Lexend font weight import is available for consistent text overlay styling, though it does not render text itself.

## Maintenance

- When refactoring modes or presets, keep the `PRESETS` map, `resolveMode`, and `useDotPositions` in sync.
- Profile animation performance after changing dot counts or rendering methods.
- Ensure new presets include mobile-friendly parameters; responsive configs should define `dotCount`, `radius`, etc., for multiple breakpoints.
