import {
    DFLT_EMBER_MARKET,
    USD_MINT,
    buildSetUserMarginTransaction,
} from '@crocswap-libs/ambient-ember';
import { Connection, PublicKey } from '@solana/web3.js';

export interface SetUserMarginResult {
    success: boolean;
    error?: string;
    signature?: string;
    confirmed?: boolean;
}

export interface SetUserMarginParams {
    userSetImBps: number; // User-specific initial margin in basis points
}

/**
 * Service for handling Solana set user margin transactions
 */
export class SetUserMarginService {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Build a set user margin transaction
     * @param params - Set user margin parameters
     * @param userPublicKey - User's public key
     * @param sessionPublicKey - Session public key (actor)
     * @param rentPayer - Optional rent payer public key
     * @returns Promise<Transaction>
     */
    private async buildSetUserMarginTransaction(
        params: SetUserMarginParams,
        userPublicKey: PublicKey,
        sessionPublicKey?: PublicKey,
        rentPayer?: PublicKey,
    ) {
        try {
            console.log('🔨 Building set user margin transaction:', {
                userSetImBps: params.userSetImBps,
                userPublicKey: userPublicKey.toString(),
                sessionPublicKey: sessionPublicKey?.toString(),
            });

            // Get market ID from SDK
            const marketId = BigInt(DFLT_EMBER_MARKET.mktId);
            console.log('  - Market ID:', marketId.toString());

            const transaction = await buildSetUserMarginTransaction(
                this.connection,
                userPublicKey,
                {
                    marketId: marketId,
                    userSetImBps: params.userSetImBps,
                    token: USD_MINT,
                    user: userPublicKey,
                    actor: sessionPublicKey,
                    rentPayer: rentPayer,
                },
            );

            console.log('✅ Set user margin transaction built successfully');
            return transaction;
        } catch (error) {
            console.error(
                '❌ Failed to build set user margin transaction:',
                error,
            );
            throw error;
        }
    }

    /**
     * Execute a set user margin transaction
     * @param params - Set user margin parameters
     * @param sessionPublicKey - Session public key
     * @param userPublicKey - User's public key
     * @param sendTransaction - Function to send transaction
     * @param rentPayer - Optional rent payer
     * @returns Promise<SetUserMarginResult>
     */
    async executeSetUserMargin(
        params: SetUserMarginParams,
        sessionPublicKey: PublicKey,
        userPublicKey: PublicKey,
        sendTransaction: (instructions: any[]) => Promise<any>,
        rentPayer?: PublicKey,
    ): Promise<SetUserMarginResult> {
        try {
            console.log('🔄 Starting set user margin execution...');

            // Build the transaction
            const transaction = await this.buildSetUserMarginTransaction(
                params,
                userPublicKey,
                sessionPublicKey,
                rentPayer,
            );

            console.log('📤 Sending set user margin transaction...');

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
                    '✅ Set user margin transaction successful:',
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
                        : 'Set user margin transaction failed';
                console.error('❌ Set user margin failed:', errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                    signature: transactionResult.signature
                        ? transactionResult.signature
                        : undefined,
                };
            }
        } catch (error) {
            console.error('❌ Set user margin error:', error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : 'Set user margin failed',
            };
        }
    }
}
