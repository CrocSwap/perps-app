import { useLocation } from 'react-router';

const pageRoutes = {
    index: '',
    trade: '/trade',
    vaults: '/vaults',
    testpage: '/testpage',
};

export type pagesT = keyof typeof pageRoutes;

export interface useLinkGenMethodsIF {
    isPage: boolean;
}

export function useLinkGen(p: pagesT): useLinkGenMethodsIF {
    const { pathname } = useLocation();

    return {
        isPage: (
            pathname.toLowerCase().startsWith(pageRoutes[p].toLowerCase())
        ),
    }
}
