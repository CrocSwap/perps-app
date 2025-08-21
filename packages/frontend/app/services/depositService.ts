import {
    buildDepositMarginTx,
    getUserTokenBalance,
} from '@crocswap-libs/ambient-ember';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { MIN_DEPOSIT_AMOUNT } from '~/utils/Constants';
// Removed notificationService - notifications handled by components

// USD token mint address from root.tsx configuration
const USD_MINT = new PublicKey('fUSDNGgHkZfwckbr5RLLvRbvqvRcTLdH9hcHJiq4jry');

export interface DepositServiceResult {
    success: boolean;
    error?: string;
    signature?: string;
    confirmed?: boolean;
    timeOfSubmission?: number;
}

export interface UserBalance {
    balance: number;
    decimalized: number;
}

/**
 * Service for handling Solana deposit transactions
 */
export class DepositService {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Get user's token balance from their wallet
     * @param userWallet - User's public key
     * @param mint - Token mint address (defaults to USD_MINT)
     * @returns Promise<UserBalance>
     */
    async getUserBalance(
        userWallet: PublicKey,
        mint?: PublicKey,
    ): Promise<UserBalance> {
        try {
            const mintToUse = mint || USD_MINT;

            const balance = await getUserTokenBalance(
                this.connection,
                userWallet,
                mintToUse,
            );

            // Convert from non-decimalized to decimalized (divide by 10^6)
            const decimalized = Number(balance) / Math.pow(10, 6);

            const result = {
                balance: Number(balance),
                decimalized,
            };

            return result;
        } catch (error) {
            console.error('❌ Error fetching user balance:', error);
            console.error('Error details:', {
                message:
                    error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace',
                userWallet: userWallet.toString(),
                mint: mint?.toString(),
            });
            throw new Error(`Failed to fetch user balance: ${error}`);
        }
    }

    /**
     * Validate deposit amount meets minimum requirements
     * @param amount - Deposit amount in decimalized form
     * @returns validation result
     */
    validateDepositAmount(amount: number | 'max'): {
        isValid: boolean;
        message?: string;
    } {
        if (amount === 'max') {
            return { isValid: true };
        }
        if (amount && amount < MIN_DEPOSIT_AMOUNT) {
            return {
                isValid: false,
                message: `Minimum deposit value is $${MIN_DEPOSIT_AMOUNT}`,
            };
        }
        return { isValid: true };
    }

    /**
     * Build a deposit margin transaction
     * @param amount - Amount to deposit (in decimalized form)
     * @param sessionPublicKey - Session public key (for transaction building)
     * @param userWalletKey - User's actual wallet public key (for PDA construction)
     * @param payerPublicKey - Payer public key from SessionState (for rent fees)
     * @returns Promise<Transaction>
     */
    async buildDepositTransaction(
        amount: number | 'max',
        sessionPublicKey: PublicKey,
        userWalletKey: PublicKey,
        payerPublicKey?: PublicKey,
    ): Promise<Transaction> {
        try {
            console.log('🔨 Building deposit transaction:');
            console.log('  - Decimalized amount:', amount);

            // Convert decimalized amount to non-decimalized (multiply by 10^6)
            const nonDecimalizedAmount =
                amount === 'max'
                    ? 'max'
                    : BigInt(Math.floor(amount * Math.pow(10, 6)));
            console.log(
                '  - Non-decimalized amount (bigint):',
                nonDecimalizedAmount,
            );
            console.log('  - Session public key:', sessionPublicKey.toString());
            console.log(
                '  - User wallet key (for PDAs):',
                userWalletKey.toString(),
            );
            console.log(
                '  - Connection endpoint:',
                this.connection.rpcEndpoint,
            );

            // Use payer from SessionState if provided, otherwise use the previous hardcoded value
            // Previous hardcoded value was: 8HnaXmgFJbvvJxSdjeNyWwMXZb85E35NM4XNg6rxuw3w
            const rentPayer =
                payerPublicKey ||
                new PublicKey('8HnaXmgFJbvvJxSdjeNyWwMXZb85E35NM4XNg6rxuw3w');

            console.log('  - Rent payer:', rentPayer.toString());

            const transaction = await buildDepositMarginTx(
                this.connection,
                userWalletKey,
                nonDecimalizedAmount,
                {
                    actor: sessionPublicKey, // sessionPublicKey as actor
                    rentPayer: rentPayer, // payer from SessionState or fallback
                },
            );

            console.log('  - Transaction built successfully:', transaction);
            console.log(
                '  - Number of instructions:',
                transaction.instructions.length,
            );
            console.log(
                '  - Instructions details:',
                transaction.instructions.map((ix, index) => ({
                    index,
                    programId: ix.programId.toString(),
                    keys: ix.keys.map((key) => ({
                        pubkey: key.pubkey.toString(),
                        isSigner: key.isSigner,
                        isWritable: key.isWritable,
                    })),
                    dataLength: ix.data.length,
                })),
            );

            return transaction;
        } catch (error) {
            console.error('❌ Error building deposit transaction:', error);
            console.error('Build transaction error details:', {
                message:
                    error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace',
                amount,
                sessionPublicKey: sessionPublicKey.toString(),
            });
            throw new Error(`Failed to build deposit transaction: ${error}`);
        }
    }

    /**
     * Execute a deposit by building and sending the transaction
     * @param amount - Amount to deposit (in decimalized form)
     * @param sessionPublicKey - Session public key (for transaction building)
     * @param userWalletKey - User's actual wallet public key (for PDA construction)
     * @param sendTransaction - Function to send the transaction (from Fogo session)
     * @param payerPublicKey - Payer public key from SessionState (for rent fees)
     * @returns Promise<DepositServiceResult>
     */
    async executeDeposit(
        amount: number | 'max',
        sessionPublicKey: PublicKey,
        userWalletKey: PublicKey,
        sendTransaction: (instructions: any[]) => Promise<any>,
        payerPublicKey?: PublicKey,
    ): Promise<DepositServiceResult> {
        try {
            // Validate amount first
            const validation = this.validateDepositAmount(amount);
            if (!validation.isValid) {
                // Note: Notifications are handled by the component using NotificationStore
                return {
                    success: false,
                    error: validation.message,
                };
            }

            // Transaction pending notification handled by component

            // Build the transaction
            const transaction = await this.buildDepositTransaction(
                amount,
                sessionPublicKey,
                userWalletKey,
                payerPublicKey,
            );

            // Extract instructions from the transaction
            const instructions = transaction.instructions;

            console.log('📤 Sending transaction:');
            console.log('  - Instructions to send:', instructions.length);
            console.log(
                '  - Instruction details:',
                instructions.map((ix, index) => ({
                    index,
                    programId: ix.programId.toString(),
                    keysCount: ix.keys.length,
                    dataLength: ix.data.length,
                    firstFewDataBytes: Array.from(ix.data.slice(0, 8)),
                })),
            );

            const timeOfSubmission = Date.now();

            // Send the transaction
            console.log('  - Calling sendTransaction with instructions...');
            console.log('  - Instructions array:', instructions);
            const transactionResult = await sendTransaction(instructions);

            console.log('📥 Transaction result:', transactionResult);

            if (
                transactionResult &&
                transactionResult.signature &&
                !('error' in transactionResult)
            ) {
                console.log(
                    '✅ Order transaction successful:',
                    transactionResult.signature,
                );
                return {
                    success: true,
                    signature: transactionResult.signature,
                    confirmed: transactionResult.confirmed,
                    timeOfSubmission,
                };
            } else {
                const errorMessage =
                    typeof transactionResult?.error === 'string'
                        ? transactionResult.error
                        : 'Order transaction failed';
                console.error('❌ Deposit order failed:', errorMessage);
                return {
                    success: false,
                    error: errorMessage,
                    signature: transactionResult.signature,
                    timeOfSubmission,
                };
            }
        } catch (error) {
            console.error('❌ Error executing deposit:', error);
            console.error('Execute deposit error details:', {
                message:
                    error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace',
                name: error instanceof Error ? error.name : 'Unknown',
                cause:
                    error instanceof Error && 'cause' in error
                        ? error.cause
                        : 'No cause',
                amount,
                sessionPublicKey: sessionPublicKey.toString(),
            });

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown error occurred';

            // Note: Error notification should be handled by the component

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Track transaction confirmation on-chain
     * @param signature - Transaction signature to track
     * @param amount - Deposit amount for logging
     * @returns Promise<boolean> - true if confirmed, false if failed or timed out
     */
    private async trackTransactionConfirmation(
        signature: string,
        amount: number,
    ): Promise<boolean> {
        const maxRetries = 30; // Check for up to 60 seconds (30 * 2s intervals)
        let retryCount = 0;

        console.log(
            `📊 Starting transaction confirmation tracking for ${signature}`,
        );

        return new Promise((resolve) => {
            const checkConfirmation = async (): Promise<void> => {
                try {
                    retryCount++;
                    console.log(
                        `🔄 Checking transaction confirmation (attempt ${retryCount}/${maxRetries})`,
                    );

                    const status =
                        await this.connection.getSignatureStatus(signature);
                    console.log(`  - Signature status result:`, status);

                    if (status.value === null) {
                        console.log(
                            `  - Transaction not found yet (attempt ${retryCount})`,
                        );
                    } else {
                        console.log(`  - Transaction found! Status:`, {
                            slot: status.value.slot,
                            confirmations: status.value.confirmations,
                            err: status.value.err,
                            confirmationStatus: status.value.confirmationStatus,
                        });

                        if (status.value.err) {
                            console.error(
                                '❌ Transaction failed on-chain:',
                                status.value.err,
                            );
                            // Error notification handled by component
                            resolve(false);
                            return;
                        }

                        if (
                            status.value.confirmationStatus === 'confirmed' ||
                            status.value.confirmationStatus === 'finalized'
                        ) {
                            console.log('✅ Transaction confirmed on-chain!');

                            // Get full transaction details
                            try {
                                const txDetails =
                                    await this.connection.getTransaction(
                                        signature,
                                        {
                                            commitment: 'confirmed',
                                            maxSupportedTransactionVersion: 0,
                                        },
                                    );
                                console.log(
                                    '📋 Full transaction details:',
                                    txDetails,
                                );

                                if (txDetails) {
                                    console.log(
                                        '💰 Transaction confirmed successfully:',
                                        {
                                            signature,
                                            slot: txDetails.slot,
                                            blockTime: txDetails.blockTime,
                                            fee: txDetails.meta?.fee,
                                            computeUnitsConsumed:
                                                txDetails.meta
                                                    ?.computeUnitsConsumed,
                                            preBalances:
                                                txDetails.meta?.preBalances,
                                            postBalances:
                                                txDetails.meta?.postBalances,
                                        },
                                    );

                                    // Don't show success here - it's handled in executeDeposit
                                }
                            } catch (detailError) {
                                console.warn(
                                    '⚠️ Could not fetch transaction details:',
                                    detailError,
                                );
                            }

                            resolve(true);
                            return;
                        }
                    }

                    // Continue checking if not confirmed and within retry limit
                    if (retryCount < maxRetries) {
                        setTimeout(checkConfirmation, 2000); // Check again in 2 seconds
                    } else {
                        console.warn(
                            '⏰ Transaction confirmation timeout after',
                            maxRetries,
                            'attempts',
                        );
                        console.warn(
                            'Transaction may still be processing. Check manually:',
                            signature,
                        );
                        // Error notification handled by component
                        resolve(false);
                    }
                } catch (error) {
                    console.error(
                        '❌ Error checking transaction status:',
                        error,
                    );
                    if (retryCount < maxRetries) {
                        setTimeout(checkConfirmation, 2000); // Retry on error
                    } else {
                        // Error notification handled by component
                        resolve(false);
                    }
                }
            };

            // Start checking immediately
            checkConfirmation();
        });
    }
}
