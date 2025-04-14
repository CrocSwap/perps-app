import { useLocation } from 'react-router';

// canonical base page route
const pageRoutes = {
    index: '',
    trade: '/trade',
    vaults: '/vaults',
    testpage: '/testpage',
};

// string-union type of all keys from `pageRoutes` obj
export type pagesT = keyof typeof pageRoutes;

// return type for the `useLinkGen()` hook
export interface useLinkGenMethodsIF {
    isPage: boolean;
}

// !important:  this file is a stub and its functionality will be increased
// !important:  ... in the future as is needed

// callable hook
export function useLinkGen(p: pagesT): useLinkGenMethodsIF {
    const { pathname } = useLocation();

    return {
        isPage: pathname.toLowerCase().startsWith(pageRoutes[p].toLowerCase()),
    };
}
