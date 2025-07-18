import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface LeverageState {
    // Per-market preferred leverage storage
    marketLeveragePreferences: { [marketSymbol: string]: number };

    // Current applied leverage (may be different from preferred if market limits are lower)
    currentLeverage: number;

    // Track the current market symbol to detect market changes
    currentMarket?: string;
}

interface LeverageStore extends LeverageState {
    /**
     * Sets the user's preferred leverage for the current market
     * This is called when user manually changes leverage
     */
    setPreferredLeverage: (leverage: number) => void;

    /**
     * Gets the preferred leverage for the current market
     */
    getPreferredLeverage: () => number;

    /**
     * Validates and applies leverage for a new market
     * Returns the leverage that should be applied
     */
    validateAndApplyLeverageForMarket: (
        marketSymbol: string,
        maxLeverage: number,
        minLeverage?: number,
    ) => number;

    /**
     * Gets the appropriate leverage for a market without changing state
     * Useful for calculating leverage on the fly
     */
    getLeverageForMarket: (
        marketSymbol: string,
        maxLeverage: number,
        minLeverage?: number,
    ) => number;

    /**
     * Reset leverage to default (clears all market preferences)
     */
    resetLeverage: () => void;

    /**
     * Get the default leverage for a new market
     */
    getDefaultLeverageForMarket: (maxLeverage: number) => number;
}

const DEFAULT_LEVERAGE = 1;
const DEFAULT_MIN_LEVERAGE = 1;
const DEFAULT_MAX_LEVERAGE_FALLBACK = 20;

export const useLeverageStore = create<LeverageStore>()(
    persist(
        (set, get) => ({
            marketLeveragePreferences: {},
            currentLeverage: DEFAULT_LEVERAGE,
            currentMarket: undefined,

            setPreferredLeverage: (leverage: number) => {
                const state = get();

                if (!state.currentMarket) {
                    console.warn(
                        'Cannot set preferred leverage without a current market',
                    );
                    return;
                }

                // Update the preferred leverage for the current market
                const updatedPreferences = {
                    ...state.marketLeveragePreferences,
                    [state.currentMarket]: leverage,
                };

                set({
                    marketLeveragePreferences: updatedPreferences,
                    currentLeverage: leverage,
                });

                console.log(
                    `Saved preferred leverage for ${state.currentMarket}: ${leverage}x`,
                );
            },

            getPreferredLeverage: () => {
                const state = get();

                if (!state.currentMarket) {
                    return DEFAULT_LEVERAGE;
                }

                return (
                    state.marketLeveragePreferences[state.currentMarket] ||
                    DEFAULT_LEVERAGE
                );
            },

            getDefaultLeverageForMarket: (maxLeverage: number) => {
                // Default to market's max leverage or 20x, whichever is lower
                return Math.min(maxLeverage, DEFAULT_MAX_LEVERAGE_FALLBACK);
            },

            validateAndApplyLeverageForMarket: (
                marketSymbol: string,
                maxLeverage: number,
                minLeverage: number = DEFAULT_MIN_LEVERAGE,
            ) => {
                const state = get();

                // Get the stored preference for this market
                const storedPreference =
                    state.marketLeveragePreferences[marketSymbol];

                let targetLeverage: number;

                if (storedPreference !== undefined) {
                    // Use stored preference
                    targetLeverage = storedPreference;
                    console.log(
                        `Using stored preference for ${marketSymbol}: ${targetLeverage}x`,
                    );
                } else {
                    // No preference exists, use default logic
                    targetLeverage =
                        get().getDefaultLeverageForMarket(maxLeverage);
                    console.log(
                        `No preference found for ${marketSymbol}, using default: ${targetLeverage}x`,
                    );

                    // Save this default as the preference for this market
                    const updatedPreferences = {
                        ...state.marketLeveragePreferences,
                        [marketSymbol]: targetLeverage,
                    };

                    set({
                        marketLeveragePreferences: updatedPreferences,
                    });
                }

                // Validate the target leverage against market limits
                const validatedLeverage = Math.max(
                    minLeverage,
                    Math.min(targetLeverage, maxLeverage),
                );

                // If the validated leverage is different from target, we need to update the preference
                if (validatedLeverage !== targetLeverage) {
                    const updatedPreferences = {
                        ...state.marketLeveragePreferences,
                        [marketSymbol]: validatedLeverage,
                    };

                    set({
                        marketLeveragePreferences: updatedPreferences,
                    });

                    console.log(
                        `Adjusted leverage for ${marketSymbol} from ${targetLeverage}x to ${validatedLeverage}x due to market limits`,
                    );
                }

                // Update state with new market and validated leverage
                set({
                    currentLeverage: validatedLeverage,
                    currentMarket: marketSymbol,
                });

                return validatedLeverage;
            },

            getLeverageForMarket: (
                marketSymbol: string,
                maxLeverage: number,
                minLeverage: number = DEFAULT_MIN_LEVERAGE,
            ) => {
                const state = get();

                // Get the stored preference for this market
                const storedPreference =
                    state.marketLeveragePreferences[marketSymbol];

                let targetLeverage: number;

                if (storedPreference !== undefined) {
                    targetLeverage = storedPreference;
                } else {
                    // Use default logic
                    targetLeverage =
                        get().getDefaultLeverageForMarket(maxLeverage);
                }

                // Validate against market limits
                return Math.max(
                    minLeverage,
                    Math.min(targetLeverage, maxLeverage),
                );
            },

            resetLeverage: () => {
                set({
                    marketLeveragePreferences: {},
                    currentLeverage: DEFAULT_LEVERAGE,
                    currentMarket: undefined,
                });
            },
        }),
        {
            name: 'leverage-store',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
