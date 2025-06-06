import { useEffect, useState } from 'react';
import { useIsClient } from './useIsClient';

export enum Pages {
    TRADE = 'trade',
    PORTFOLIO = 'portfolio',
    VAULTS = 'vaults',
}

/**
 * Custom Hook to check if the component is mounted on the client side
 */
export function usePage() {
    const isClient = useIsClient();

    const [page, setPage] = useState<Pages>();

    useEffect(() => {
        if (isClient) {
            const path = window.location.pathname;
            if (path.split('/').length > 1) {
                const page = path.split('/')[1];
                if (page === Pages.TRADE) {
                    setPage(Pages.TRADE);
                } else if (page === Pages.PORTFOLIO) {
                    setPage(Pages.PORTFOLIO);
                } else if (page === Pages.VAULTS) {
                    setPage(Pages.VAULTS);
                }
            }
        }
    }, [isClient]);

    return { page };
}
