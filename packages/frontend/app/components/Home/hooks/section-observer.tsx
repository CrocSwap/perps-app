'use client';

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { PresetId } from '../types';
import { useSectionRegistry } from './use-section-registry';

interface SectionObserverProps {
    containerRef: MutableRefObject<HTMLElement | null>;
    onPresetChange: (preset: PresetId) => void;
}

// =========================================================================
// COMPONENT
// =========================================================================

/**
 * Observes sections with `data-preset` attributes and triggers preset changes
 * when they become visible in the viewport.
 */
export function SectionObserver({
    containerRef,
    onPresetChange,
}: SectionObserverProps) {
    const registry = useSectionRegistry(containerRef);
    const observerCleanupRef = useRef<() => void>();
    const hasInitializedRef = useRef(false);
    const initializationTimeoutRef = useRef<number>();

    useEffect(() => {
        hasInitializedRef.current = false;
        if (initializationTimeoutRef.current) {
            clearTimeout(initializationTimeoutRef.current);
        }

        // Ensure the hero section is visible on mount.
        registry.scrollToPreset('hero', 'auto');

        observerCleanupRef.current = registry.observeSections((preset) => {
            if (!hasInitializedRef.current) {
                return;
            }
            onPresetChange(preset);
        });

        initializationTimeoutRef.current = window.setTimeout(() => {
            hasInitializedRef.current = true;
        }, 500);

        return () => {
            observerCleanupRef.current?.();
            if (initializationTimeoutRef.current) {
                clearTimeout(initializationTimeoutRef.current);
            }
            hasInitializedRef.current = false;
        };
    }, [registry, onPresetChange]);

    return null;
}
