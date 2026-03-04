import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    useEffect,
} from 'react';
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
    checkIfCodeExists: (code: string) => Promise<boolean>;
    checkIfCodeIsAvailableForInviteeToUse: (code: string) => Promise<boolean>;
    getRefCode: (
        userIdentifier: string,
        identifierType: UserIdentifierType,
    ) => Promise<Affiliate | null>;
}

const FuulContext = createContext<FuulContextType>({
    isInitialized: false,
    trackPageView: () => {},
    sendConversionEvent: () => Promise.resolve(),
    checkIfCodeExists: () => Promise.resolve(false),
    checkIfCodeIsAvailableForInviteeToUse: () => Promise.resolve(false),
    getRefCode: () => Promise.resolve(null),
});

export const useFuul = () => {
    const context = useContext(FuulContext);
    if (!context) {
        throw new Error('useFuul must be used within a FuulProvider');
    }
    return context;
};

// just for pageview tracking
const FUUL_PROJECTS = [
    '3b31ebc0-f09d-4880-9c8c-04769701ef9a',
    '0303273c-c574-4a64-825c-b67091ec6813',
];

export const FuulProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        console.log('[fuul] init effect', {
            isInitialized,
            hasApiKey: Boolean(FUUL_API_KEY),
        });
        if (FUUL_API_KEY && !isInitialized) {
            try {
                const result = Fuul.init({
                    apiKey: FUUL_API_KEY,
                });
                console.log('[fuul] init success', { result });
                // Assume initialization is successful if no error is thrown
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize Fuul:', error);
            }
        } else if (!FUUL_API_KEY) {
            console.warn('[fuul] init skipped: missing API key');
        }
    }, [FUUL_API_KEY]);

    const trackPageView = useCallback((): void => {
        if (isInitialized) {
            Fuul.sendPageview(undefined, FUUL_PROJECTS);
        } else {
            console.warn(
                'Cannot send pageview before Fuul system is initialized',
            );
        }
    }, [isInitialized]);

    const sendConversionEvent = useCallback(
        async (
            userIdentifier: string,
            identifierType: UserIdentifierType,
            eventName: string,
        ): Promise<void> => {
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
        },
        [isInitialized],
    );

    const contextValue = useMemo(
        () => ({
            isInitialized,
            trackPageView,
            sendConversionEvent,
            checkIfCodeExists: Fuul.isAffiliateCodeFree,
            checkIfCodeIsAvailableForInviteeToUse:
                Fuul.isAffiliateCodeAvailable,
            getRefCode: Fuul.getAffiliateCode,
        }),
        [isInitialized, trackPageView, sendConversionEvent],
    );

    return (
        <FuulContext.Provider value={contextValue}>
            {children}
        </FuulContext.Provider>
    );
};
