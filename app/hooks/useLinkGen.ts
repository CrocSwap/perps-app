import { useLocation } from 'react-router';

const pageRoutes = {
    index: '',
    trade: '/trade',
    vaults: '/vaults',
    testpage: '/testpage',
};

export type pagesT = keyof typeof pageRoutes;

export function useLinkGen(p: pagesT) {
    const { pathname } = useLocation();
    console.log('pages: ', pageRoutes);
    console.log(pathname);

    const isPage: boolean = pathname.toLowerCase().startsWith(pageRoutes[p].toLowerCase());
    console.log(isPage);
}
