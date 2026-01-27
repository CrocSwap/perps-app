import { useCallback, useReducer, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { PresetId, DotFieldMode } from '../../types';

interface TransitionState {
    preset: PresetId;
    displayMode: DotFieldMode;
    effectiveMode: DotFieldMode;
    isInitialLoad: boolean;
    fadeInStart: number | null;
    transitionStart: number | null;
}

interface SetModesResult {
    displayChanged: boolean;
    effectiveChanged: boolean;
}

type TransitionAction =
    | { type: 'SET_PRESET'; preset: PresetId }
    | {
          type: 'SET_MODES';
          displayMode: DotFieldMode;
          effectiveMode: DotFieldMode;
      }
    | { type: 'MARK_FADE_IN_START'; timestamp: number }
    | { type: 'MARK_TRANSITION_START'; timestamp: number }
    | { type: 'COMPLETE_INITIAL_LOAD' };

function reducer(
    state: TransitionState,
    action: TransitionAction,
): TransitionState {
    switch (action.type) {
        case 'SET_PRESET':
            if (state.preset === action.preset) {
                return state;
            }
            return {
                ...state,
                preset: action.preset,
            };
        case 'SET_MODES':
            if (
                state.displayMode === action.displayMode &&
                state.effectiveMode === action.effectiveMode
            ) {
                return state;
            }
            return {
                ...state,
                displayMode: action.displayMode,
                effectiveMode: action.effectiveMode,
            };
        case 'MARK_FADE_IN_START':
            return {
                ...state,
                fadeInStart: action.timestamp,
            };
        case 'MARK_TRANSITION_START':
            return {
                ...state,
                transitionStart: action.timestamp,
            };
        case 'COMPLETE_INITIAL_LOAD':
            if (!state.isInitialLoad) {
                return state;
            }
            return {
                ...state,
                isInitialLoad: false,
            };
        default:
            return state;
    }
}

export interface PresetTransitionController {
    state: TransitionState;
    presetRef: MutableRefObject<PresetId>;
    modeRef: MutableRefObject<DotFieldMode>;
    setPreset: (preset: PresetId) => void;
    setModes: (
        displayMode: DotFieldMode,
        effectiveMode: DotFieldMode,
    ) => SetModesResult;
    markFadeInStart: (timestamp: number) => void;
    markTransitionStart: (timestamp: number) => void;
    completeInitialLoad: () => void;
}

interface PresetTransitionOptions {
    preset: PresetId;
    displayMode: DotFieldMode;
    effectiveMode: DotFieldMode;
}

export function usePresetTransitionController({
    preset,
    displayMode,
    effectiveMode,
}: PresetTransitionOptions): PresetTransitionController {
    const [state, dispatch] = useReducer(reducer, {
        preset,
        displayMode,
        effectiveMode,
        isInitialLoad: true,
        fadeInStart: null,
        transitionStart: null,
    });

    const presetRef = useRef<PresetId>(state.preset);
    const modeRef = useRef<DotFieldMode>(state.effectiveMode);

    const setPreset = useCallback((nextPreset: PresetId) => {
        if (presetRef.current === nextPreset) {
            return;
        }
        presetRef.current = nextPreset;
        dispatch({ type: 'SET_PRESET', preset: nextPreset });
    }, []);

    const setModes = useCallback(
        (
            nextDisplayMode: DotFieldMode,
            nextEffectiveMode: DotFieldMode,
        ): SetModesResult => {
            const displayChanged = state.displayMode !== nextDisplayMode;
            const effectiveChanged = state.effectiveMode !== nextEffectiveMode;
            if (!displayChanged && !effectiveChanged) {
                modeRef.current = nextEffectiveMode;
                return { displayChanged, effectiveChanged };
            }
            modeRef.current = nextEffectiveMode;
            dispatch({
                type: 'SET_MODES',
                displayMode: nextDisplayMode,
                effectiveMode: nextEffectiveMode,
            });
            return { displayChanged, effectiveChanged };
        },
        [state.displayMode, state.effectiveMode],
    );

    const markFadeInStart = useCallback((timestamp: number) => {
        dispatch({ type: 'MARK_FADE_IN_START', timestamp });
    }, []);

    const markTransitionStart = useCallback((timestamp: number) => {
        dispatch({ type: 'MARK_TRANSITION_START', timestamp });
    }, []);

    const completeInitialLoad = useCallback(() => {
        dispatch({ type: 'COMPLETE_INITIAL_LOAD' });
    }, []);

    presetRef.current = state.preset;
    modeRef.current = state.effectiveMode;

    return {
        state,
        presetRef,
        modeRef,
        setPreset,
        setModes,
        markFadeInStart,
        markTransitionStart,
        completeInitialLoad,
    };
}
