import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Fuul } from '@fuul/sdk';
import { FUUL_API_KEY } from '../utils/Constants';

interface FuulContextType {
    isInitialized: boolean;
    trackPageView: () => void;
}

const FuulContext = createContext<FuulContextType>({
    isInitialized: false,
    trackPageView: () => {},
});

export const useFuul = () => {
    const context = useContext(FuulContext);
    if (!context) {
        throw new Error('useFuul must be used within a FuulProvider');
    }
    return context;
};

export const FuulProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const location = useLocation();

    useEffect(() => {
        console.log('fuul', { isInitialized });
        if (FUUL_API_KEY && !isInitialized) {
            try {
                const result = Fuul.init({
                    apiKey: FUUL_API_KEY,
                });
                console.log('fuul', { result });
                // Assume initialization is successful if no error is thrown
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize Fuul:', error);
            }
        }
    }, [FUUL_API_KEY]);

    useEffect(() => {
        console.log({ isInitialized });
        if (isInitialized) {
            console.log({ location, Fuul });
            Fuul.sendPageview();
        } else {
            localStorage.removeItem('fuul.sent_pageview');
        }
    }, [location, isInitialized]);

    const trackPageView = () => {
        if (isInitialized) {
            Fuul.sendPageview();
        }
    };

    return (
        <FuulContext.Provider value={{ isInitialized, trackPageView }}>
            {children}
        </FuulContext.Provider>
    );
};
