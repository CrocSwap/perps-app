import {
    DFLT_EMBER_MARKET,
    OrderSide,
    TimeInForce,
    buildOrderEntryTransaction,
} from '@crocswap-libs/ambient-ember';
import { Connection, PublicKey } from '@solana/web3.js';
import { MARKET_ORDER_PRICE_OFFSET_USD } from '~/utils/Constants';
import { marketOrderLogManager } from './MarketOrderLogManager';
import { t } from 'i18next';
import { buildCompleteConversionIx } from '~/utils/refreg';

export interface MarketOrderResult {
    success: boolean;
    error?: string;
    signature?: string;
    confirmed?: boolean;
    timeOfSubmission?: number;
}

export interface MarketOrderParams {
    quantity: number; // User input quantity (will be multiplied by 100_000_000)
    side: 'buy' | 'sell';
    leverage?: number; // Optional leverage multiplier for calculating userSetImBps
    bestBidPrice?: number; // Best bid price from order book (for sell orders)
    bestAskPrice?: number; // Best ask price from order book (for buy orders)
    reduceOnly?: boolean; // Optional reduce-only flag
}

/**
 * Service for handling Solana market order transactions
 */
export class MarketOrderService {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Build a market order transaction
     * @param params - Order parameters
     * @param userPublicKey - User's public key
     * @param rentPayer - Optional rent payer public key
     * @returns Promise<Transaction>
     */
    private async buildMarketOrderTransaction(
        params: MarketOrderParams,
        userPublicKey: PublicKey,
        sessionPublicKey?: PublicKey,
        rentPayer?: PublicKey,
    ) {
        try {
            console.log('🔨 Building market order transaction:', {
                side: params.side,
                quantity: params.quantity,
                userPublicKey: userPublicKey.toString(),
            });

            // Generate order ID using Unix timestamp
            const orderId = BigInt(Date.now());
            console.log('  - Order ID (timestamp):', orderId.toString());

            // Get market ID from SDK
            const marketId = BigInt(DFLT_EMBER_MARKET.mktId);
            console.log('  - Market ID:', marketId.toString());

            // Convert displayed quantity to on-chain quantity (8 decimal places)
            const onChainQuantity = BigInt(
                Math.floor(params.quantity * 100_000_000),
            );
            console.log('  - Display quantity:', params.quantity);
            console.log('  - On-chain quantity:', onChainQuantity.toString());

            // Calculate userSetImBps from leverage if provided
            let userSetImBps: number | undefined;
            if (params.leverage && params.leverage > 0) {
                userSetImBps = Math.floor((1 / params.leverage) * 10000) - 1;
                console.log('  - Leverage:', params.leverage);
                console.log('  - Calculated userSetImBps:', userSetImBps);
            }

            // Get the cached market order log page to avoid RPC call
            const cachedLogPage = marketOrderLogManager.getCachedLogPage();
            if (cachedLogPage !== undefined) {
                console.log(
                    '  - Using cached marketOrderLogPage:',
                    cachedLogPage,
                );
            }

            // Calculate fill prices based on order book
            let fillPrice: bigint;
            if (params.side === 'buy') {
                // For buy orders: use best ask + offset
                if (!params.bestAskPrice) {
                    throw new Error(
                        'Cannot execute market buy order: No ask prices available in order book',
                    );
                }
                const fillPriceUsd =
                    params.bestAskPrice + MARKET_ORDER_PRICE_OFFSET_USD;
                fillPrice = BigInt(Math.floor(fillPriceUsd * 1_000_000)); // Convert to 6 decimal places
                console.log('  - Buy order fill price calculation:');
                console.log('    - Best ask price:', params.bestAskPrice);
                console.log('    - Offset:', MARKET_ORDER_PRICE_OFFSET_USD);
                console.log('    - Fill price USD:', fillPriceUsd);
                console.log(
                    '    - Fill price (on-chain):',
                    fillPrice.toString(),
                );
            } else {
                // For sell orders: use best bid - offset
                if (!params.bestBidPrice) {
                    throw new Error(
                        'Cannot execute market sell order: No bid prices available in order book',
                    );
                }
                const fillPriceUsd =
                    params.bestBidPrice - MARKET_ORDER_PRICE_OFFSET_USD;
                fillPrice = BigInt(Math.floor(fillPriceUsd * 1_000_000)); // Convert to 6 decimal places
                console.log('  - Sell order fill price calculation:');
                console.log('    - Best bid price:', params.bestBidPrice);
                console.log('    - Offset:', MARKET_ORDER_PRICE_OFFSET_USD);
                console.log('    - Fill price USD:', fillPriceUsd);
                console.log(
                    '    - Fill price (on-chain):',
                    fillPrice.toString(),
                );
            }

            // Build the appropriate transaction based on side
            if (params.side === 'buy') {
                console.log('  - Building market BUY order...');
                console.log('  - Log page:', cachedLogPage);

                const orderParams: any = {
                    marketId: marketId,
                    orderId: orderId,
                    side: OrderSide.Bid,
                    qty: onChainQuantity,
                    price: BigInt('0'), // market order convention is to use 0
                    fillPrice: fillPrice,
                    tif: { type: TimeInForce.IOC },
                    user: userPublicKey,
                    actor: sessionPublicKey,
                    rentPayer: rentPayer,
                    keeper: sessionPublicKey,
                    userSetImBps: userSetImBps,
                    includesFillAtMarket: true,
                    marketOrderLogPage: cachedLogPage,
                    reduceOnly: params.reduceOnly,
                };

                const transaction = buildOrderEntryTransaction(
                    this.connection,
                    orderParams,
                    'confirmed',
                );
                console.log('✅ Market buy order built successfully');
                console.log('  - Transaction details:', transaction);
                return transaction;
            } else {
                console.log('  - Building market SELL order...');
                const orderParams: any = {
                    marketId: marketId,
                    orderId: orderId,
                    side: OrderSide.Ask,
                    qty: onChainQuantity,
                    price: BigInt('0'), // market order convention is to use 0
                    fillPrice: fillPrice,
                    tif: { type: TimeInForce.IOC },
                    user: userPublicKey,
                    actor: sessionPublicKey,
                    rentPayer: rentPayer,
                    keeper: sessionPublicKey,
                    userSetImBps: userSetImBps,
                    includesFillAtMarket: true, // Ensure fill at market is included
                    marketOrderLogPage: cachedLogPage,
                    reduceOnly: params.reduceOnly,
                };

                const transaction = buildOrderEntryTransaction(
                    this.connection,
                    orderParams,
                    'confirmed',
                );
                console.log('✅ Market sell order built successfully');
                return transaction;
            }
        } catch (error) {
            console.error('❌ Error building market order transaction:', error);
            console.error('Build transaction error details:', {
                message:
                    error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace',
                params,
                userPublicKey: userPublicKey.toString(),
            });
            throw new Error(`Failed to build market order: ${error}`);
        }
    }

    /**
     * Execute a market order by building and sending the transaction
     * @param params - Order parameters
     * @param sessionPublicKey - Session public key (for transaction building)
     * @param userWalletKey - User's actual wallet public key (for order owner)
     * @param sendTransaction - Function to send the transaction (from Fogo session)
     * @param rentPayer - Optional rent payer public key
     * @returns Promise<MarketOrderResult>
     */
    async executeMarketOrder(
        params: MarketOrderParams,
        sessionPublicKey: PublicKey,
        userWalletKey: PublicKey,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendTransaction: (instructions: any[]) => Promise<any>,
        rentPayer?: PublicKey,
    ): Promise<MarketOrderResult> {
        try {
            console.log('📈 Executing market order:', {
                side: params.side,
                quantity: params.quantity,
                sessionKey: sessionPublicKey.toString(),
                walletKey: userWalletKey.toString(),
            });

            // Build the transaction
            // Use wallet key as the order owner
            const transaction = await this.buildMarketOrderTransaction(
                params,
                userWalletKey,
                sessionPublicKey,
                rentPayer,
            );

            // Extract instructions from the transaction
            const instructions = [...transaction.instructions];

            const conversionIx = await buildCompleteConversionIx({
                sessionPublicKey,
                walletPublicKey: userWalletKey,
            });
            if (conversionIx) {
                instructions.push(conversionIx);
            }

            console.log('📤 Sending market order transaction:');
            console.log('  - Instructions to send:', instructions.length);
            console.log(
                '  - Instruction details:',
                instructions.map((ix, index) => ({
                    index,
                    programId: ix.programId.toString(),
                    keysCount: ix.keys.length,
                    dataLength: ix.data.length,
                })),
            );

            const timeOfSubmission = Date.now();

            // Send the transaction using Fogo session
            console.log('  - Calling sendTransaction...');
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
                        : t('transactions.marketTxFailedFallbackMessage');
                return {
                    success: false,
                    error: errorMessage,
                    signature: transactionResult.signature
                        ? transactionResult.signature
                        : undefined,
                    timeOfSubmission,
                };
            }
        } catch (error) {
            console.error('❌ Error executing market order:', error);
            console.error('Execute order error details:', {
                message:
                    error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace',
                name: error instanceof Error ? error.name : 'Unknown',
                params,
                sessionPublicKey: sessionPublicKey.toString(),
            });

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown error occurred';

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Track transaction confirmation on-chain
     * @param signature - Transaction signature
     * @param params - Order parameters for logging
     * @returns Promise<boolean> - true if confirmed, false if failed or timed out
     */
    private async trackTransactionConfirmation(
        signature: string,
        params: MarketOrderParams,
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const maxRetries = 30; // 60 seconds total (2 seconds per check)
            let retryCount = 0;

            const checkConfirmation = async () => {
                try {
                    retryCount++;
                    console.log(
                        `🔍 Checking transaction status (attempt ${retryCount}/${maxRetries})...`,
                    );

                    const status =
                        await this.connection.getSignatureStatus(signature);

                    if (status && status.value) {
                        console.log(
                            '📊 Transaction status:',
                            status.value.confirmationStatus,
                        );

                        if (status.value.err) {
                            console.error(
                                '❌ Transaction failed on-chain:',
                                status.value.err,
                            );
                            resolve(false);
                            return;
                        }

                        if (
                            status.value.confirmationStatus === 'confirmed' ||
                            status.value.confirmationStatus === 'finalized'
                        ) {
                            console.log('✅ Transaction confirmed on-chain!');
                            console.log(
                                `✅ Market ${params.side} order for ${params.quantity} units confirmed`,
                            );
                            resolve(true);
                            return;
                        }
                    }

                    // Continue checking if not confirmed yet
                    if (retryCount < maxRetries) {
                        setTimeout(checkConfirmation, 2000); // Check every 2 seconds
                    } else {
                        console.warn(
                            '⏱️ Transaction confirmation timeout for signature:',
                            signature,
                        );
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
                        resolve(false);
                    }
                }
            };

            // Start checking immediately
            checkConfirmation();
        });
    }
}
