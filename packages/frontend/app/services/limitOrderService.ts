import {
    DFLT_EMBER_MARKET,
    OrderSide,
    TimeInForce,
    buildOrderEntryTransaction,
    cancelOrderIx,
} from '@crocswap-libs/ambient-ember';
import { Connection, PublicKey } from '@solana/web3.js';

export interface LimitOrderResult {
    success: boolean;
    error?: string;
    signature?: string;
    confirmed?: boolean;
}

export interface LimitOrderParams {
    quantity: number; // User input quantity (will be multiplied by 100_000_000)
    price: number; // User input price (will be multiplied by 1_000_000)
    side: 'buy' | 'sell';
    leverage?: number; // Optional leverage multiplier for calculating userSetImBps
    replaceOrderId?: bigint; // Optional order ID to replace an existing order
}

/**
 * Service for handling Solana limit order transactions
 */
export class LimitOrderService {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Build a limit order transaction
     * @param params - Order parameters
     * @param userPublicKey - User's public key
     * @param rentPayer - Optional rent payer public key
     * @returns Promise<Transaction>
     */
    private async buildLimitOrderTransaction(
        params: LimitOrderParams,
        userPublicKey: PublicKey,
        sessionPublicKey?: PublicKey,
        rentPayer?: PublicKey,
    ) {
        try {
            console.log('🔨 Building limit order transaction:', {
                side: params.side,
                quantity: params.quantity,
                price: params.price,
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

            // Convert displayed price to on-chain price (6 decimal places)
            const onChainPrice = BigInt(Math.floor(params.price * 1_000_000));
            console.log('  - Display price:', params.price);
            console.log('  - On-chain price:', onChainPrice.toString());

            // Calculate userSetImBps from leverage if provided
            let userSetImBps: number | undefined;
            if (params.leverage && params.leverage > 0) {
                userSetImBps = Math.floor((1 / params.leverage) * 10000) - 1;
                console.log('  - Leverage:', params.leverage);
                console.log('  - Calculated userSetImBps:', userSetImBps);
            }

            if (params.replaceOrderId) {
                console.log(
                    '  - This order will replace existing order ID:',
                    params.replaceOrderId.toString(),
                );
            }

            // Build the appropriate transaction based on side
            if (params.side === 'buy') {
                console.log('  - Building limit BUY order...');
                const orderParams: any = {
                    marketId: marketId,
                    orderId: orderId,
                    side: OrderSide.Bid,
                    qty: onChainQuantity,
                    price: onChainPrice,
                    tif: { type: TimeInForce.GTC }, // Good Till Cancelled for limit orders
                    user: userPublicKey,
                    actor: sessionPublicKey,
                    rentPayer: rentPayer,
                    userSetImBps: userSetImBps,
                    includesFillAtMarket: true,
                    cancelOrderId: params.replaceOrderId,
                };

                const transaction = buildOrderEntryTransaction(
                    this.connection,
                    orderParams,
                    'confirmed',
                );
                console.log('✅ Limit buy order built successfully');
                return transaction;
            } else {
                console.log('  - Building limit SELL order...');
                const orderParams: any = {
                    marketId: marketId,
                    orderId: orderId,
                    side: OrderSide.Ask,
                    qty: onChainQuantity,
                    price: onChainPrice,
                    tif: { type: TimeInForce.GTC }, // Good Till Cancelled for limit orders
                    user: userPublicKey,
                    actor: sessionPublicKey,
                    rentPayer: rentPayer,
                    userSetImBps: userSetImBps,
                    includesFillAtMarket: true,
                    cancelOrderId: params.replaceOrderId,
                };

                console.log('  - Order parameters:', orderParams);

                const transaction = buildOrderEntryTransaction(
                    this.connection,
                    orderParams,
                    'confirmed',
                );
                console.log('✅ Limit sell order built successfully');
                return transaction;
            }
        } catch (error) {
            console.error('❌ Error building limit order transaction:', error);
            console.error('Build transaction error details:', {
                message:
                    error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : 'No stack trace',
                params,
                userPublicKey: userPublicKey.toString(),
            });
            throw new Error(`Failed to build limit order: ${error}`);
        }
    }

    /**
     * Execute a limit order by building and sending the transaction
     * @param params - Order parameters
     * @param sessionPublicKey - Session public key (for transaction building)
     * @param userWalletKey - User's actual wallet public key (for order owner)
     * @param sendTransaction - Function to send the transaction (from Fogo session)
     * @param rentPayer - Optional rent payer public key
     * @returns Promise<LimitOrderResult>
     */
    async executeLimitOrder(
        params: LimitOrderParams,
        sessionPublicKey: PublicKey,
        userWalletKey: PublicKey,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendTransaction: (instructions: any[]) => Promise<any>,
        rentPayer?: PublicKey,
    ): Promise<LimitOrderResult> {
        try {
            console.log('📈 Executing limit order:', {
                side: params.side,
                quantity: params.quantity,
                price: params.price,
                sessionKey: sessionPublicKey.toString(),
                walletKey: userWalletKey.toString(),
            });

            // Build the transaction
            // Use wallet key as the order owner
            const transaction = await this.buildLimitOrderTransaction(
                params,
                userWalletKey,
                sessionPublicKey,
                rentPayer,
            );

            // Extract instructions from the transaction
            const instructions = transaction.instructions;

            console.log('📤 Sending limit order transaction:');
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
                };
            } else {
                const errorMessage =
                    typeof transactionResult?.error === 'string'
                        ? transactionResult.error
                        : 'Order transaction failed';
                return {
                    success: false,
                    error: errorMessage,
                };
            }
        } catch (error) {
            console.error('❌ Error executing limit order:', error);
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
}
