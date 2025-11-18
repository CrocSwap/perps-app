import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
     * Selector function to get the current leverage
     * Used for subscribing to leverage changes in components
     */
    selectLeverage: () => number;

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
                    set({ currentLeverage: leverage });
                    return;
                }

                const updatedPreferences = {
                    ...state.marketLeveragePreferences,
                    [state.currentMarket]: leverage,
                };

                set({
                    marketLeveragePreferences: updatedPreferences,
                    currentLeverage: leverage,
                });
            },

            selectLeverage: () => {
                const state = get();
                return state.currentLeverage;
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

                // Defensive logic: If we know this market should have higher leverage, ignore suspiciously low values
                const knownHighLeverageMarkets = [
                    'ETH',
                    'BTC',
                    'ETHEREUM',
                    'BITCOIN',
                ];
                const isHighLeverageMarket = knownHighLeverageMarkets.some(
                    (market) => marketSymbol.toUpperCase().includes(market),
                );

                if (isHighLeverageMarket && maxLeverage <= 10) {
                    console.warn(
                        `⚠️ IGNORING: ${marketSymbol} has suspiciously low maxLeverage=${maxLeverage}. This looks like stale data from another market. Waiting for correct value.`,
                    );
                    return state.currentLeverage; // Return current leverage without changing anything
                }

                // Get the stored preference for this specific market
                const storedPreference =
                    state.marketLeveragePreferences[marketSymbol];

                let targetLeverage: number;
                let isUsingStoredPreference = false;

                if (storedPreference !== undefined) {
                    // Use stored preference for this specific market
                    targetLeverage = storedPreference;
                    isUsingStoredPreference = true;
                } else {
                    // No preference exists for this market, calculate fresh default
                    targetLeverage =
                        get().getDefaultLeverageForMarket(maxLeverage);

                    // DON'T save the default as a preference yet - only save when user manually changes
                }

                // Validate the target leverage against market limits
                const validatedLeverage = Math.max(
                    minLeverage,
                    Math.min(targetLeverage, maxLeverage),
                );

                // If the validated leverage is different from target AND we had a stored preference,
                // update the preference to reflect the market limits
                if (
                    validatedLeverage !== targetLeverage &&
                    isUsingStoredPreference
                ) {
                    const updatedPreferences = {
                        ...state.marketLeveragePreferences,
                        [marketSymbol]: validatedLeverage,
                    };

                    set({
                        marketLeveragePreferences: updatedPreferences,
                    });
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
