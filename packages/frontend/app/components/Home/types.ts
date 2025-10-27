export const PRESET_IDS = [
    'hero',
    'speed',
    'fees',
    'mev',
    'vault',
    'links',
] as const;

export type PresetId = (typeof PRESET_IDS)[number];

export type DotFieldMode = 'fullscreen' | 'right-side' | 'bottom';

export interface ModeContext {
    preset: PresetId;
    isMobile: boolean;
}

export interface ModeInfo {
    mode: DotFieldMode;
    effectiveMode: DotFieldMode;
}
