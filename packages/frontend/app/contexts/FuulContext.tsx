import { createContext, useContext, useState, useEffect } from 'react';
import { Fuul, UserIdentifierType, type Affiliate } from '@fuul/sdk';
import { FUUL_API_KEY } from '../utils/Constants';

interface FuulContextType {
    isInitialized: boolean;
    trackPageView: () => void;
    sendConversionEvent: (
        userIdentifier: string,
        identifierType: UserIdentifierType,
        eventName: string,
    ) => Promise<void>;
    isRefCodeFree: (code: string) => Promise<boolean>;
    getRefCode: (
        userIdentifier: string,
        identifierType: UserIdentifierType,
    ) => Promise<Affiliate | null>;
}

const FuulContext = createContext<FuulContextType>({
    isInitialized: false,
    trackPageView: () => {},
    sendConversionEvent: () => Promise.resolve(),
    isRefCodeFree: () => Promise.resolve(false),
    getRefCode: () => Promise.resolve(null),
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

    // just for pageview tracking
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

    async function sendConversionEvent(
        userIdentifier: string,
        identifierType: UserIdentifierType,
        eventName: string,
    ): Promise<void> {
        if (!isInitialized) {
            console.warn(
                'Cannot send conversion event before Fuul system is initialized',
            );
            return;
        }
        try {
            await Fuul.sendEvent(eventName, {
                user_id: userIdentifier,
                user_id_type: identifierType,
            });
        } catch (error) {
            console.error('Failed to send conversion event:', error);
        }
    }

    return (
        <FuulContext.Provider
            value={{
                isInitialized,
                trackPageView,
                sendConversionEvent,
                isRefCodeFree: Fuul.isAffiliateCodeFree,
                getRefCode: Fuul.getAffiliateCode,
            }}
        >
            {children}
        </FuulContext.Provider>
    );
};
