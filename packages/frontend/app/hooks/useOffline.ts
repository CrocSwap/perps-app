import { useAppStateStore } from '~/stores/AppStateStore';

/**
 * Hook to check offline status and whether trading actions should be disabled.
 *
 * @returns {Object} Offline state
 * @returns {boolean} isOffline - True if the browser is offline
 * @returns {boolean} canTrade - True if trading actions are allowed (online)
 */
export function useOffline() {
    const { internetConnected } = useAppStateStore();

    return {
        isOffline: !internetConnected,
        canTrade: internetConnected,
    };
}
