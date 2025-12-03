# Home Module

## Overview

The Home module renders the landing experience for the perpetuals product. It coordinates:

- A hero overlay (`Copy/`) driven by `OVERLAY_SLIDE_CONFIG`
- Animated dot backgrounds (`Particles/`)
- Scroll snapping and preset tracking (`use-section-scroll`, `SectionObserver`)
- Section indicators that mirror the overlay state

The layout lives in `Home.tsx`, which mounts the background, overlay copy, animated dots, and scroll containers.

## File & Directory Map

```
Home/
├── Home.tsx                     # Main composition component
├── Home.module.css              # Layout styles & typography overrides
├── types.ts                     # Shared preset/id/type definitions
├── config/
│   ├── overlay-config.ts        # Slide configuration + typing
│   └── overlay-links.ts         # Link grid data for Links slide
├── hooks/
│   ├── use-overlay-focus.ts     # Focus management & live region updates
│   └── use-section-scroll.ts    # Scroll helpers (also imported by SectionObserver)
├── Background/                  # Static background blur
├── Copy/                        # Overlay text/CTA slides
│   ├── Copy.tsx                 # Renders slides based on config
│   ├── Copy.module.css          # Overlay styles
│   └── slides/                  # Individual slide components
├── LinkCard/                    # Link card presentation for Links slide
├── RotatingList/                # Animated feature bullet list
├── SectionIndicators/           # Right-hand preset dots
├── Ticker/                      # Market ticker used in hero footer
└── Particles/               # Canvas-based background animation
```

## Rendering Flow

1. `Home.tsx` initializes the active preset and creates a snapping container of placeholder sections for scroll targets.
2. `SectionObserver` tracks viewport visibility and updates `currentPreset`.
3. `Copy.tsx` renders overlay slides (`HeroSlide`, `FeatureSlide`, `LinksSlide`) using `OVERLAY_SLIDE_CONFIG`. It also exposes ARIA live updates and handles focus via `useOverlayFocus`.
4. `AnimatedDots` listens to `preset` changes to update the dot field background.
5. `SectionIndicators` mirrors the preset state and provides click-to-scroll shortcuts.

## Config Driven Slides

- `config/overlay-config.ts` declares slide shapes (`HeroSlideConfig`, `FeatureSlideConfig`, `LinksSlideConfig`) and their data.
- Changing overlay content generally happens in that config file.
- Slides map `slide.type` to dedicated components. Add new slide types by extending the config types union and adding a matching component.

## Hooks & Utilities

- `use-overlay-focus.ts` ensures only the active slide has reachable focusable elements. It manages:
    - Registering slide refs
    - Updating an ARIA live region for screen reader announcements
    - Enabling/disabling tab navigation per slide
- `use-section-scroll.ts` abstracts scroll snapping logic, providing `scrollToPreset` and `scrollByDelta` helpers consumed by both `Home.tsx` and `Copy.tsx`.

## Styling

- Global design tokens live in `src/index.css`. Component styles rely on `var(--token)` variables for colors, spacing, radii, shadows, and transitions.
- `Home.module.css` enforces `font-weight: 300` for headings on this page without altering global typography.
- Beware of global resets that apply `!important`; override as needed within the module to avoid unintended inheritance.

## Accessibility

- `Copy.tsx` exposes a live region to announce the active slide.
- `use-overlay-focus` keeps focusable elements disabled when their slide is inactive to prevent keyboard traps.
- `SectionIndicators` uses `aria-hidden` and clear hover/focus states.
- Ensure new slides define unique `headingId` keys via `OVERLAY_SLIDE_CONFIG`.

## Extensibility

To add a new slide:

1. Extend `PresetId` in `types.ts` and update `PRESET_IDS` ordering if necessary.
2. Append a new entry in `config/overlay-config.ts`.
3. Create a slide component (e.g., `Copy/slides/NewSlide.tsx`) and update `renderSlideContent` to route the new type.
4. Provide animation data if required (`Particles/presets/`).
5. Update `use-overlay-focus` default refs & any section placeholder markup in `Home.tsx`.

## Key Dependencies

- **React & TypeScript** for component structure and typing.
- **CSS Modules** for scoped styling.
- **Web Animations** via custom hooks (`AnimatedDots`, `RotatingList`).

## Testing & QA Notes

- Scroll behavior relies on IntersectionObserver; verify behavior in browsers lacking support or add polfills.
- Accessiblity expectations: keyboard navigation should land in the active slide and ticker controls remain reachable.
- Use responsive mode to confirm layout constraints across breakpoints (desktop hero vs. mobile stacked layout).

## Integration Tips

- `Home` assumes a parent layout that renders a fixed header of height `var(--header-height-desktop)`. Adjust tokens or container offsets if embedding elsewhere.
- Ensure Lexend Deca font weights (300, 400, 500) are available globally as referenced in `index.css`.

## Maintenance Checklist

- When editing CSS, prefer design tokens to literal values.
- Document significant logic changes both in this README and inline comments where logic is not self-evident.
- Keep `OVERLAY_SLIDE_CONFIG` and `PRESET_IDS` in sync to avoid missing sections.
