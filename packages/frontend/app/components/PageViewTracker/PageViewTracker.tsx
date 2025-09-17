import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Fuul } from '@fuul/sdk';

export const PageViewTracker = () => {
    const location = useLocation();

    useEffect(() => {
        Fuul.sendPageview();
    }, [location]);

    return null;
};

export default PageViewTracker;
