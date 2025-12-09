import React, { createContext, useContext, useState, useEffect } from 'react';
import { Fuul, UserIdentifierType } from '@fuul/sdk';
import { FUUL_API_KEY } from '../utils/Constants';
import type { AffiliateCodeParams } from 'node_modules/@fuul/sdk/dist/types/sdk';

interface FuulContextType {
    isInitialized: boolean;
    trackPageView: () => void;
    isAffiliateCodeFree: (code: string) => Promise<boolean>;
    getAffiliateCode: (
        userIdentifier: string,
        identifierType: UserIdentifierType,
    ) => Promise<string | null>;
}

const FuulContext = createContext<FuulContextType>({
    isInitialized: false,
    trackPageView: () => {},
    isAffiliateCodeFree: () => Promise.resolve(false),
    getAffiliateCode: () => Promise.resolve(null),
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

    const projects = [
        '3b31ebc0-f09d-4880-9c8c-04769701ef9a',
        '0303273c-c574-4a64-825c-b67091ec6813',
    ];

    function trackPageView(): void {
        if (isInitialized) {
            Fuul.sendPageview(undefined, projects);
        } else {
            console.warn(
                'Cannot send pageview before Fuul system is initialized',
            );
        }
    }

    return (
        <FuulContext.Provider
            value={{
                isInitialized,
                trackPageView,
                isAffiliateCodeFree: Fuul.isAffiliateCodeFree,
                getAffiliateCode: Fuul.getAffiliateCode,
            }}
        >
            {children}
        </FuulContext.Provider>
    );
};
