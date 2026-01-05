import { useSession, isEstablished } from '@fogo/sessions-sdk-react';
import { useCallback } from 'react';
import {
    LimitOrderService,
    type LimitOrderParams,
} from '~/services/limitOrderService';
import { PublicKey } from '@solana/web3.js';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useConnection } from '@fogo/sessions-sdk-react';

export function useLimitOrderService() {
    const sessionState = useSession();
    const { symbolInfo } = useTradeDataStore();
    const connection = useConnection();

    const executeLimitOrder = useCallback(
        async (params: LimitOrderParams) => {
            if (!isEstablished(sessionState)) {
                console.error('Session not established');
                return {
                    success: false,
                    error: 'Please connect your wallet',
                };
            }

            if (!symbolInfo) {
                console.error('Symbol info not available');
                return {
                    success: false,
                    error: 'Trading pair information not available',
                };
            }

            try {
                const limitOrderService = new LimitOrderService(connection);

                // Convert public key strings to PublicKey objects
                const sessionPublicKey = new PublicKey(
                    sessionState.sessionPublicKey,
                );
                const userWalletKey = new PublicKey(
                    sessionState.walletPublicKey,
                );

                // Use rentPayer if available
                const paymaster = sessionState.payer || undefined;

                const result = await limitOrderService.executeLimitOrder(
                    params,
                    sessionPublicKey,
                    userWalletKey,
                    sessionState.sendTransaction,
                    paymaster,
                );

                return result;
            } catch (error) {
                console.error('Error in useLimitOrderService:', error);
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Unknown error occurred',
                };
            }
        },
        [sessionState, symbolInfo, connection],
    );

    return { executeLimitOrder };
}
