import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    type Dispatch,
    type SetStateAction,
} from 'react';
import { useLocation } from 'react-router';
import { useDebugStore } from '~/stores/DebugStore';
import { useReferralStore } from '~/stores/ReferralStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { initializePythPriceService } from '~/stores/PythPriceStore';
import {
    buildConnectWalletIx,
    pollConnectWalletConsistency,
} from '~/utils/refreg';

interface AppContextType {
    isUserConnected: boolean;
    setIsUserConnected: Dispatch<SetStateAction<boolean>>;
    assignDefaultAddress: () => void;
}

export const AppContext = createContext<AppContextType>({
    isUserConnected: false,
    setIsUserConnected: () => {},
    assignDefaultAddress: () => {},
});

export interface AppProviderProps {
    children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const {
        isDebugWalletActive,
        debugWallet,
        manualAddressEnabled,
        manualAddress,
    } = useDebugStore();

    const { setUserAddress, userAddress } = useUserDataStore();
    const cachedReferralCode = useReferralStore((state) => state.cached);

    const { resetUserData } = useTradeDataStore();

    const sessionState = useSession();
    const location = useLocation();
    const lastConnectWalletKeyRef = useRef<string | null>(null);

    // Drive userAddress from URL parameter, session, or debug settings
    useEffect(() => {
        const { isDebugWalletActive, manualAddressEnabled, manualAddress } =
            useDebugStore.getState();

        // 1. Manual Debug Address takes highest priority
        if (
            !isDebugWalletActive &&
            manualAddressEnabled &&
            manualAddress &&
            manualAddress.length > 0
        ) {
            setUserAddress(manualAddress);
            return;
        }

        // 2. URL Address takes second priority
        const pathParts = location.pathname.split('/');
        const portfolioIdx = pathParts.indexOf('portfolio');
        const tradeHistoryIdx = pathParts.indexOf('tradeHistory');

        let urlAddr = '';
        if (portfolioIdx !== -1 && pathParts[portfolioIdx + 1]) {
            urlAddr = pathParts[portfolioIdx + 1];
        } else if (tradeHistoryIdx !== -1 && pathParts[tradeHistoryIdx + 1]) {
            urlAddr = pathParts[tradeHistoryIdx + 1];
        }

        if (urlAddr && urlAddr.length >= 32 && urlAddr.length <= 44) {
            setUserAddress(urlAddr);
            return;
        }

        // 3. Established Session takes third priority
        if (isEstablished(sessionState) && !isDebugWalletActive) {
            setUserAddress(sessionState.walletPublicKey.toString());
            return;
        }

        // 4. Fallback to Debug Wallet or Empty
        if (isDebugWalletActive) {
            setUserAddress(debugWallet.address);
        } else {
            setUserAddress('');
            resetUserData();
        }
    }, [
        location.pathname,
        sessionState,
        setUserAddress,
        resetUserData,
        isDebugWalletActive,
        debugWallet,
        manualAddressEnabled,
        manualAddress,
        userAddress,
    ]);

    // Initialize Pyth price service on mount
    useEffect(() => {
        initializePythPriceService();
    }, []);

    useEffect(() => {
        console.info('[refreg] connect_wallet effect triggered', {
            path: location.pathname,
            userAddress,
            hasCachedReferralCode: Boolean(cachedReferralCode),
            isSessionEstablished: isEstablished(sessionState),
        });

        if (!isEstablished(sessionState)) {
            console.info(
                '[refreg] connect_wallet effect skipped: session not established',
            );
            lastConnectWalletKeyRef.current = null;
            return;
        }

        if (typeof sessionState.sendTransaction !== 'function') {
            console.info(
                '[refreg] connect_wallet effect skipped: sendTransaction unavailable',
            );
            return;
        }

        const walletPublicKey = sessionState.walletPublicKey;
        const sessionPublicKey = sessionState.sessionPublicKey;
        const payerPublicKey = sessionState.payer;
        if (!walletPublicKey || !sessionPublicKey) {
            console.info(
                '[refreg] connect_wallet effect skipped: missing wallet/session pubkey',
            );
            return;
        }
        if (!payerPublicKey) {
            console.info(
                '[refreg] connect_wallet effect skipped: missing payer/sponsor pubkey',
            );
            return;
        }

        void (async () => {
            console.info('[refreg] building connect_wallet instruction', {
                walletPublicKey: walletPublicKey.toBase58(),
                sessionPublicKey: sessionPublicKey.toBase58(),
                payerPublicKey: payerPublicKey.toBase58(),
            });

            const connectWallet = await buildConnectWalletIx({
                sessionPublicKey,
                walletPublicKey,
                payerPublicKey,
            });

            if (!connectWallet) {
                console.info(
                    '[refreg] connect_wallet instruction build returned null',
                );
                lastConnectWalletKeyRef.current = null;
                return;
            }

            console.log('[refreg] connect_wallet instruction ready', {
                fingerprint: connectWallet.fingerprint,
                walletPublicKey: walletPublicKey.toBase58(),
                trackingIdLength: connectWallet.trackingId.length,
                trackingIdPreview: Array.from(connectWallet.trackingId)
                    .slice(0, 4)
                    .map((byte) => byte.toString(16).padStart(2, '0'))
                    .join(''),
                referralKind: connectWallet.referralAttribution.referralKind,
                referralSourceValue:
                    connectWallet.referralAttribution.sourceValue,
            });

            if (lastConnectWalletKeyRef.current === connectWallet.fingerprint) {
                console.info(
                    '[refreg] connect_wallet skipped: fingerprint already sent in this session',
                    { fingerprint: connectWallet.fingerprint },
                );
                return;
            }
            lastConnectWalletKeyRef.current = connectWallet.fingerprint;

            try {
                const submitStartedAt = Date.now();
                const instruction = connectWallet.instruction;
                const instructionTag =
                    instruction.data.length > 0 ? instruction.data[0] : null;

                console.info('[refreg] sending connect_wallet tx', {
                    fingerprint: connectWallet.fingerprint,
                    walletPublicKey: walletPublicKey.toBase58(),
                    sessionPublicKey: sessionPublicKey.toBase58(),
                    referralKind:
                        connectWallet.referralAttribution.referralKind,
                    referralSourceValue:
                        connectWallet.referralAttribution.sourceValue,
                    instructionProgramId:
                        connectWallet.instruction.programId.toBase58(),
                    instructionTag,
                    instructionDataLength: instruction.data.length,
                    instructionKeyCount: instruction.keys.length,
                    instructionKeys: instruction.keys.map((key, index) => ({
                        index,
                        pubkey: key.pubkey.toBase58(),
                        isSigner: key.isSigner,
                        isWritable: key.isWritable,
                    })),
                });
                const transactionResult = await sessionState.sendTransaction([
                    connectWallet.instruction,
                ]);
                const submitDurationMs = Date.now() - submitStartedAt;
                const txHash = transactionResult?.signature ?? null;
                const hasTransactionError =
                    Boolean(transactionResult) &&
                    typeof transactionResult === 'object' &&
                    'error' in transactionResult;

                console.info('[refreg] connect_wallet tx submission resolved', {
                    fingerprint: connectWallet.fingerprint,
                    walletPublicKey: walletPublicKey.toBase58(),
                    txHash,
                    signature: txHash,
                    confirmed: transactionResult?.confirmed ?? null,
                    submitDurationMs,
                    hasTransactionError,
                    transactionResult,
                });
                if (transactionResult?.signature) {
                    console.info('[refreg] connect_wallet tx hash received', {
                        txHash: transactionResult.signature,
                        signature: transactionResult.signature,
                        walletPublicKey: walletPublicKey.toBase58(),
                        submitDurationMs,
                    });

                    void pollConnectWalletConsistency({
                        walletPublicKey,
                        referralAttribution: connectWallet.referralAttribution,
                    })
                        .then((results) => {
                            console.log(
                                '[refreg] connect_wallet consistency checks finished',
                                {
                                    signature: transactionResult.signature,
                                    walletPublicKey: walletPublicKey.toBase58(),
                                    results,
                                },
                            );
                        })
                        .catch((error) => {
                            console.info(
                                '[refreg] connect_wallet polling failed:',
                                error,
                            );
                        });
                } else {
                    console.log(
                        '[refreg] connect_wallet tx returned without tx hash/signature; consistency checks skipped',
                        {
                            fingerprint: connectWallet.fingerprint,
                            walletPublicKey: walletPublicKey.toBase58(),
                            submitDurationMs,
                            hasTransactionError,
                            transactionResult,
                        },
                    );
                }
            } catch (error) {
                console.info('[refreg] connect_wallet sendTransaction threw:', {
                    fingerprint: connectWallet.fingerprint,
                    walletPublicKey: walletPublicKey.toBase58(),
                    sessionPublicKey: sessionPublicKey.toBase58(),
                    error,
                });
                lastConnectWalletKeyRef.current = null;
            }
        })();
    }, [sessionState, location.pathname, userAddress, cachedReferralCode]);

    return (
        <AppContext.Provider
            value={{
                isUserConnected: isEstablished(sessionState),
                setIsUserConnected: () => {}, // Handled by session sdk now
                assignDefaultAddress: () => {}, // Driven by effect above
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
