import {
    DFLT_EMBER_MARKET,
    buildCancelOrderTransaction,
} from '@crocswap-libs/ambient-ember';
import { Connection, PublicKey } from '@solana/web3.js';
import { marketOrderLogManager } from './MarketOrderLogManager';

export interface CancelOrderResult {
    success: boolean;
    error?: string;
    signature?: string;
    confirmed?: boolean;
}

export interface CancelOrderParams {
    orderId: number | bigint; // Order ID to cancel
}

/**
 * Service for handling Solana cancel order transactions
 */
export class CancelOrderService {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Build a cancel order transaction
     * @param params - Cancel order parameters
     * @param userPublicKey - User's public key (order owner)
     * @param sessionPublicKey - Session public key (actor)
     * @param rentPayer - Optional rent payer public key
     * @returns Promise<Transaction>
     */
    private async buildCancelOrderTransaction(
        params: CancelOrderParams,
        userPublicKey: PublicKey,
        sessionPublicKey?: PublicKey,
        rentPayer?: PublicKey,
    ) {
        try {
            console.log('🔨 Building cancel order transaction:', {
                orderId: params.orderId.toString(),
                userPublicKey: userPublicKey.toString(),
                sessionPublicKey: sessionPublicKey?.toString(),
            });

            // Get market ID from SDK
            const marketId = BigInt(DFLT_EMBER_MARKET.mktId);
            console.log('  - Market ID:', marketId.toString());

            // Convert order ID to bigint if needed
            const orderIdBigInt =
                typeof params.orderId === 'bigint'
                    ? params.orderId
                    : BigInt(params.orderId);

            // Get the cached market order log page to avoid RPC call
            const cachedLogPage = marketOrderLogManager.getCachedLogPage();
            if (cachedLogPage !== undefined) {
                console.log(
                    '  - Using cached marketOrderLogPage:',
                    cachedLogPage,
                );
            }

            const transaction = await buildCancelOrderTransaction(
                this.connection,
                {
                    marketId: marketId,
                    orderId: orderIdBigInt,
                    user: userPublicKey,
                    actor: sessionPublicKey,
                    rentPayer: rentPayer,
                    marketOrderLogPage: cachedLogPage,
                },
            );

            console.log('✅ Cancel order transaction built successfully');
            return transaction;
        } catch (error) {
            console.error(
                '❌ Failed to build cancel order transaction:',
                error,
            );
            throw error;
        }
    }

    /**
     * Execute a cancel order transaction
     * @param params - Cancel order parameters
     * @param sessionPublicKey - Session public key
     * @param userPublicKey - User's public key
     * @param sendTransaction - Function to send transaction
     * @param rentPayer - Optional rent payer
     * @returns Promise<CancelOrderResult>
     */
    async executeCancelOrder(
        params: CancelOrderParams,
        sessionPublicKey: PublicKey,
        userPublicKey: PublicKey,
        sendTransaction: (instructions: any[]) => Promise<any>,
        rentPayer?: PublicKey,
    ): Promise<CancelOrderResult> {
        try {
            console.log('🔄 Starting cancel order execution...');

            // Build the transaction
            const transaction = await this.buildCancelOrderTransaction(
                params,
                userPublicKey,
                sessionPublicKey,
                rentPayer,
            );

            console.log('📤 Sending cancel order transaction...');

            console.log(transaction);
            // Send the transaction
            const transactionResult = await sendTransaction(
                transaction.instructions,
            );

            console.log('📥 Transaction result:', transactionResult);

            if (
                transactionResult &&
                transactionResult.signature &&
                !('error' in transactionResult)
            ) {
                console.log(
                    '✅ Cancel order transaction successful:',
                    transactionResult.signature,
                );
                return {
                    success: true,
                    signature: transactionResult.signature,
                    confirmed: transactionResult.confirmed,
                };
            } else {
                const errorMessage =
                    typeof transactionResult?.error === 'string'
                        ? transactionResult.error
                        : 'Cancel order transaction failed';
                console.error('❌ Cancel order failed:', errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                    signature: transactionResult.signature
                        ? transactionResult.signature
                        : undefined,
                };
            }
        } catch (error) {
            console.error('❌ Cancel order error:', error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Cancel order failed',
            };
        }
    }
}
