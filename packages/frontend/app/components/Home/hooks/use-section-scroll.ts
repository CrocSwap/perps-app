import { useSectionRegistry } from './use-section-registry';
import type { MutableRefObject } from 'react';
import type { PresetId } from './types';

export interface SectionScrollControls {
    scrollToPreset: (preset: PresetId, behavior?: ScrollBehavior) => void;
    scrollByDelta: (deltaY: number) => void;
    getSectionElement: (preset: PresetId) => HTMLElement | null;
    getAllSections: () => HTMLElement[];
}

export function useSectionScroll(
    containerRef: MutableRefObject<HTMLElement | null>,
): SectionScrollControls {
    const registry = useSectionRegistry(containerRef);

    const getSectionElement = (preset: PresetId) =>
        registry.getSection(preset) ?? null;

    const getAllSections = () => registry.listSections();

    return {
        scrollToPreset: registry.scrollToPreset,
        scrollByDelta: registry.scrollByDelta,
        getSectionElement,
        getAllSections,
    };
}
