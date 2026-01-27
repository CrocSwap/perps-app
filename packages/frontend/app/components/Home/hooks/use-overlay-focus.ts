import { useEffect, useMemo, useRef, useState } from 'react';
import type { PresetId } from '../types';

interface UseOverlayFocusOptions {
    active: PresetId;
}

interface UseOverlayFocusResult {
    isReady: boolean;
    liveStatus: string;
    registerSlide: (preset: PresetId) => (node: HTMLDivElement | null) => void;
    isSlideActive: (preset: PresetId) => boolean;
    getFocusableState: (preset: PresetId) => 'enabled' | 'disabled';
}

export function useOverlayFocus({
    active,
}: UseOverlayFocusOptions): UseOverlayFocusResult {
    const [isReady, setIsReady] = useState(false);
    const [liveStatus, setLiveStatus] = useState('');
    const slideRefs = useRef<Record<PresetId, HTMLDivElement | null>>({
        hero: null,
        speed: null,
        fees: null,
        mev: null,
        vault: null,
        links: null,
    });
    const focusStatesRef = useRef<Record<PresetId, 'enabled' | 'disabled'>>({
        hero: 'disabled',
        speed: 'disabled',
        fees: 'disabled',
        mev: 'disabled',
        vault: 'disabled',
        links: 'disabled',
    });
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        const timeout = window.setTimeout(() => setIsReady(true), 60);
        return () => window.clearTimeout(timeout);
    }, []);

    useEffect(() => {
        const activeSlide = slideRefs.current[active];
        if (!activeSlide) return;

        const heading =
            activeSlide.querySelector<HTMLElement>('[id$="heading"]');
        if (heading) {
            setLiveStatus(heading.textContent ?? '');
        }
    }, [active]);

    useEffect(() => {
        Object.keys(focusStatesRef.current).forEach((preset) => {
            focusStatesRef.current[preset as PresetId] =
                preset === active ? 'enabled' : 'disabled';
        });
        forceUpdate((value) => value + 1);
    }, [active]);

    const registerSlide =
        (preset: PresetId) => (node: HTMLDivElement | null) => {
            slideRefs.current[preset] = node;
        };

    const isSlideActive = (preset: PresetId) => active === preset;

    const getFocusableState = useMemo(() => {
        return (preset: PresetId) => focusStatesRef.current[preset];
    }, []);

    return {
        isReady,
        liveStatus,
        registerSlide,
        isSlideActive,
        getFocusableState,
    };
}
