import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { PresetId } from '../types';

const SECTION_SELECTOR = '[data-preset]';
// 30% of the current speed (full speed is at 1. instant jump)
const SCROLL_SENSITIVITY = 0.3;

type SectionElement = HTMLElement & { dataset: { preset?: string } };

type SectionObserverCleanup = () => void;

type SectionObserverCallback = (preset: PresetId) => void;

export interface SectionRegistryApi {
    getSection: (preset: PresetId) => SectionElement | undefined;
    scrollToPreset: (preset: PresetId, behavior?: ScrollBehavior) => void;
    scrollByDelta: (deltaY: number) => void;
    observeSections: (
        callback: SectionObserverCallback,
    ) => SectionObserverCleanup;
    listSections: () => SectionElement[];
}

function collectSections(container: HTMLElement | null): SectionElement[] {
    if (container) {
        return Array.from(
            container.querySelectorAll<SectionElement>(SECTION_SELECTOR),
        );
    }
    return Array.from(
        document.querySelectorAll<SectionElement>(SECTION_SELECTOR),
    );
}

export function useSectionRegistry(
    containerRef: MutableRefObject<HTMLElement | null>,
): SectionRegistryApi {
    const sectionsRef = useRef<SectionElement[]>([]);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const refreshSections = useCallback(() => {
        sectionsRef.current = collectSections(containerRef.current);
    }, [containerRef]);

    useEffect(() => {
        refreshSections();
    }, [refreshSections]);

    const getSection = useCallback((preset: PresetId) => {
        return sectionsRef.current.find(
            (section) => section.dataset.preset === preset,
        );
    }, []);

    const listSections = useCallback(() => {
        refreshSections();
        return [...sectionsRef.current];
    }, [refreshSections]);

    const scrollToPreset = useCallback(
        (preset: PresetId, behavior: ScrollBehavior = 'auto') => {
            const target = getSection(preset);
            if (!target) {
                return;
            }

            const container = containerRef.current;
            if (container && container.contains(target)) {
                const offsetTop = target.offsetTop;
                container.scrollTo({ top: offsetTop, behavior });
            } else {
                target.scrollIntoView({ behavior, block: 'start' });
            }
        },
        [containerRef, getSection],
    );

    const scrollByDelta = useCallback(
        (deltaY: number) => {
            const container = containerRef.current;
            if (!container || deltaY === 0) {
                return;
            }
            container.scrollBy({
                top: deltaY * SCROLL_SENSITIVITY,
                behavior: 'smooth',
            });
        },
        [containerRef],
    );

    const observeSections = useCallback(
        (callback: SectionObserverCallback): SectionObserverCleanup => {
            refreshSections();
            const container = containerRef.current;
            const options: IntersectionObserverInit = {
                threshold: 0.5,
                root: container ?? null,
                rootMargin: '-10% 0px -10% 0px',
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    const preset = entry.target.getAttribute(
                        'data-preset',
                    ) as PresetId | null;
                    if (preset) {
                        callback(preset);
                    }
                });
            }, options);

            sectionsRef.current.forEach((section) => observer.observe(section));
            observerRef.current = observer;

            return () => {
                observer.disconnect();
                if (observerRef.current === observer) {
                    observerRef.current = null;
                }
            };
        },
        [containerRef, refreshSections],
    );

    const api = useMemo<SectionRegistryApi>(
        () => ({
            getSection,
            scrollToPreset,
            scrollByDelta,
            observeSections,
            listSections,
        }),
        [
            getSection,
            listSections,
            observeSections,
            scrollByDelta,
            scrollToPreset,
        ],
    );

    return api;
}
