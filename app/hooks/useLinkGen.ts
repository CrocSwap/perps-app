import { useLocation } from 'react-router';

const pageRoutes = {
    index: '',
    trade: '/trade',
    vaults: '/vaults',
};

export function useLinkGen() {
    const loc = useLocation();
    console.log('pages: ', pageRoutes);
    console.log(loc);
}
