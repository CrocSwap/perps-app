'use client';

import { useState, useMemo } from 'react';

interface UseCommissionSplitOptions {
    commissionRate?: number;
    initialSliderValue?: number;
}

interface UseCommissionSplitResult {
    sliderValue: number;
    setSliderValue: (value: number) => void;
    hasValidCommissionRate: boolean;
    inviteePercentage: number;
    youAmount: number;
    inviteeAmount: number;
    sliderStep: number;
}

/**
 * Hook for managing commission split slider calculations.
 *
 * The slider value represents the percentage the affiliate keeps (50-100).
 * The invitee gets the rest (0-50).
 */
export function useCommissionSplit(
    options: UseCommissionSplitOptions = {},
): UseCommissionSplitResult {
    const { commissionRate, initialSliderValue = 100 } = options;
    const [sliderValue, setSliderValue] = useState(initialSliderValue);

    const hasValidCommissionRate =
        commissionRate !== undefined && !isNaN(commissionRate);

    const calculations = useMemo(() => {
        const inviteePercentage = 100 - sliderValue;

        let youAmount = 0;
        let inviteeAmount = 0;

        if (hasValidCommissionRate) {
            youAmount = Math.round((commissionRate * sliderValue) / 100);
            inviteeAmount = Math.round(commissionRate) - youAmount;
        }

        // Use integer step to avoid floating precision issues that can block endpoint values.
        const sliderStep = 1;

        return {
            inviteePercentage,
            youAmount,
            inviteeAmount,
            sliderStep,
        };
    }, [sliderValue, hasValidCommissionRate, commissionRate]);

    return {
        sliderValue,
        setSliderValue,
        hasValidCommissionRate,
        ...calculations,
    };
}
