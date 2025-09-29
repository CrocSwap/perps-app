import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Fuul } from '@fuul/sdk';
import { FUUL_API_KEY } from '~/utils/Constants';

export const PageViewTracker = () => {
    const location = useLocation();

    // Initialize Fuul SDK
    useEffect(() => {
        if (FUUL_API_KEY) {
            Fuul.init({ apiKey: FUUL_API_KEY });
        }
    }, [FUUL_API_KEY]);

    useEffect(() => {
        Fuul.sendPageview();
    }, [location]);

    return null;
};

export default PageViewTracker;
