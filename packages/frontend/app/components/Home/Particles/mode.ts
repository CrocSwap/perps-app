import type { ModeContext, ModeInfo, DotFieldMode } from '../types';

const HERO_PRESETS = new Set<ModeContext['preset']>(['hero', 'links']);

export function resolveMode({ preset, isMobile }: ModeContext): ModeInfo {
    let mode: DotFieldMode;

    if (HERO_PRESETS.has(preset)) {
        mode = 'fullscreen';
    } else if (isMobile) {
        mode = 'bottom';
    } else {
        mode = 'right-side';
    }

    const effectiveMode: DotFieldMode =
        mode === 'right-side' && isMobile ? 'bottom' : mode;

    return { mode, effectiveMode };
}
