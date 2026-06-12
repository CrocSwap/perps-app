import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Connection } from '@solana/web3.js';
import { TEST_PUBLIC_KEYS } from '~/test-utils/solana';
import { marketOrderLogManager } from './MarketOrderLogManager';

const mocks = vi.hoisted(() => {
    const instruction = {
        programId: { toString: () => 'mock-program' },
        keys: [],
        data: Buffer.from('ix'),
    };
    return {
        instruction,
        buildOrderEntryTransaction: vi.fn(() => ({
            instructions: [instruction],
        })),
        buildCancelOrderTransaction: vi.fn(async () => ({
            instructions: [instruction],
        })),
        buildSetUserMarginTransaction: vi.fn(async () => ({
            instructions: [instruction],
        })),
        buildDepositMarginTx: vi.fn(async () => ({
            instructions: [instruction],
        })),
        buildWithdrawMarginTx: vi.fn(async () => ({
            instructions: [instruction],
        })),
        getUserTokenBalance: vi.fn(async () => 123_000_000n),
        buildTradeRefregInstructions: vi.fn(async () => ({
            instructions: [instruction],
            includesFirstTrade: true,
            includesCompleteConversion: true,
            referralAttribution: {
                referralKind: 'pubkey',
                sourceValue: 'referrer',
            },
        })),
        sendStandaloneRefregTransactions: vi.fn(async () => undefined),
        pollTradeConsistency: vi.fn(async () => []),
    };
});

vi.mock('@crocswap-libs/ambient-ember', () => ({
    DFLT_EMBER_MARKET: { mktId: 64 },
    USD_MINT: 'USD_MINT',
    OrderSide: { Bid: 'Bid', Ask: 'Ask' },
    TimeInForce: { GTC: 'GTC', IOC: 'IOC' },
    buildOrderEntryTransaction: mocks.buildOrderEntryTransaction,
    buildCancelOrderTransaction: mocks.buildCancelOrderTransaction,
    buildSetUserMarginTransaction: mocks.buildSetUserMarginTransaction,
    buildDepositMarginTx: mocks.buildDepositMarginTx,
    buildWithdrawMarginTx: mocks.buildWithdrawMarginTx,
    getUserTokenBalance: mocks.getUserTokenBalance,
    getCurrentLogPage: vi.fn(),
    getMarketOrderLogInfo: vi.fn(),
    getUserMarginBucket: vi.fn(),
}));

vi.mock('~/utils/refreg', () => ({
    buildTradeRefregInstructions: mocks.buildTradeRefregInstructions,
    sendStandaloneRefregTransactions: mocks.sendStandaloneRefregTransactions,
    pollTradeConsistency: mocks.pollTradeConsistency,
}));

vi.mock('i18next', () => ({
    t: (key: string) => key,
}));

const { LimitOrderService } = await import('./limitOrderService');
const { MarketOrderService } = await import('./marketOrderService');
const { CancelOrderService } = await import('./cancelOrderService');
const { SetUserMarginService } = await import('./setUserMarginService');
const { DepositService } = await import('./depositService');
const { WithdrawService } = await import('./withdrawService');

const connection = new Connection('http://127.0.0.1:8899');
const sendSuccess = () =>
    vi.fn(async () => ({ signature: 'sig', confirmed: true }));

describe('transaction services', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
        vi.spyOn(marketOrderLogManager, 'getCachedLogPage').mockReturnValue(12);
    });

    it('builds and sends scaled limit buy orders', async () => {
        const sendTransaction = sendSuccess();
        const result = await new LimitOrderService(
            connection,
        ).executeLimitOrder(
            {
                side: 'buy',
                quantity: 1.23456789,
                price: 123.456789,
                leverage: 5,
                replaceOrderId: 99n,
                reduceOnly: true,
            },
            TEST_PUBLIC_KEYS.session,
            TEST_PUBLIC_KEYS.user,
            sendTransaction,
            TEST_PUBLIC_KEYS.payer,
        );

        const orderParams = (
            mocks.buildOrderEntryTransaction.mock.calls[0] as unknown[]
        )[1];
        expect(orderParams).toMatchObject({
            marketId: 64n,
            orderId: 1_700_000_000_000n,
            side: 'Bid',
            qty: 123456788n,
            price: 123456789n,
            tif: { type: 'GTC' },
            user: TEST_PUBLIC_KEYS.user,
            actor: TEST_PUBLIC_KEYS.session,
            rentPayer: TEST_PUBLIC_KEYS.payer,
            userSetImBps: 1999,
            cancelOrderId: 99n,
            marketOrderLogPage: 12,
            reduceOnly: true,
        });
        expect(sendTransaction).toHaveBeenCalledWith([mocks.instruction]);
        expect(result).toMatchObject({
            success: true,
            signature: 'sig',
            confirmed: true,
            timeOfSubmission: 1_700_000_000_000,
        });
        await vi.waitFor(() => {
            expect(mocks.buildTradeRefregInstructions).toHaveBeenCalled();
            expect(mocks.sendStandaloneRefregTransactions).toHaveBeenCalledWith(
                expect.objectContaining({ context: 'limit_order' }),
            );
            expect(mocks.pollTradeConsistency).toHaveBeenCalled();
        });
    });

    it('returns limit-order error envelopes and skips refreg without a payer', async () => {
        const sendTransaction = vi.fn(async () => ({
            signature: 'failed-sig',
            error: 'limit failed',
        }));
        const result = await new LimitOrderService(
            connection,
        ).executeLimitOrder(
            { side: 'sell', quantity: 1, price: 2 },
            TEST_PUBLIC_KEYS.session,
            TEST_PUBLIC_KEYS.user,
            sendTransaction,
        );

        expect(
            (mocks.buildOrderEntryTransaction.mock.calls[0] as unknown[])[1],
        ).toMatchObject({ side: 'Ask' });
        expect(result).toMatchObject({
            success: false,
            error: 'limit failed',
            signature: 'failed-sig',
        });
        expect(mocks.buildTradeRefregInstructions).not.toHaveBeenCalled();
    });

    it('builds market orders with IOC fill price safeguards', async () => {
        const sendTransaction = sendSuccess();
        const service = new MarketOrderService(connection);

        const buy = await service.executeMarketOrder(
            {
                side: 'buy',
                quantity: 2,
                bestAskPrice: 100,
                leverage: 10,
                reduceOnly: false,
            },
            TEST_PUBLIC_KEYS.session,
            TEST_PUBLIC_KEYS.user,
            sendTransaction,
        );
        expect(buy.success).toBe(true);
        expect(
            (mocks.buildOrderEntryTransaction.mock.calls[0] as unknown[])[1],
        ).toMatchObject({
            side: 'Bid',
            qty: 200000000n,
            price: 0n,
            fillPrice: 150000000n,
            tif: { type: 'IOC' },
            keeper: TEST_PUBLIC_KEYS.session,
            userSetImBps: 999,
        });

        const missingAsk = await service.executeMarketOrder(
            { side: 'buy', quantity: 1 },
            TEST_PUBLIC_KEYS.session,
            TEST_PUBLIC_KEYS.user,
            sendSuccess(),
        );
        expect(missingAsk).toMatchObject({
            success: false,
            error: expect.stringContaining('No ask prices available'),
        });
    });

    it('builds cancel and margin transactions with expected envelope handling', async () => {
        const cancelSend = sendSuccess();
        const cancel = await new CancelOrderService(
            connection,
        ).executeCancelOrder(
            { orderId: 123 },
            TEST_PUBLIC_KEYS.session,
            TEST_PUBLIC_KEYS.user,
            cancelSend,
            TEST_PUBLIC_KEYS.payer,
        );
        expect(mocks.buildCancelOrderTransaction).toHaveBeenCalledWith(
            connection,
            expect.objectContaining({
                marketId: 64n,
                orderId: 123n,
                user: TEST_PUBLIC_KEYS.user,
                actor: TEST_PUBLIC_KEYS.session,
                rentPayer: TEST_PUBLIC_KEYS.payer,
                marketOrderLogPage: 12,
            }),
        );
        expect(cancel).toMatchObject({ success: true, signature: 'sig' });

        const marginSend = vi.fn(async () => ({ error: 'margin failed' }));
        const margin = await new SetUserMarginService(
            connection,
        ).executeSetUserMargin(
            { userSetImBps: 1500 },
            TEST_PUBLIC_KEYS.session,
            TEST_PUBLIC_KEYS.user,
            marginSend,
            TEST_PUBLIC_KEYS.payer,
        );
        expect(mocks.buildSetUserMarginTransaction).toHaveBeenCalledWith(
            connection,
            TEST_PUBLIC_KEYS.user,
            expect.objectContaining({
                marketId: 64n,
                userSetImBps: 1500,
                token: 'USD_MINT',
                actor: TEST_PUBLIC_KEYS.session,
                rentPayer: TEST_PUBLIC_KEYS.payer,
            }),
        );
        expect(margin).toMatchObject({
            success: false,
            error: 'margin failed',
        });
    });

    it('validates and executes deposit flows without live token/RPC calls', async () => {
        const service = new DepositService(connection);

        await expect(
            service.getUserBalance(TEST_PUBLIC_KEYS.user),
        ).resolves.toEqual({
            balance: 123000000,
            decimalized: 123,
        });
        expect(service.validateDepositAmount(0.5)).toEqual({
            isValid: false,
            message: 'Minimum deposit value is $1',
        });

        const result = await service.executeDeposit(
            2.5,
            TEST_PUBLIC_KEYS.session,
            TEST_PUBLIC_KEYS.user,
            sendSuccess(),
            TEST_PUBLIC_KEYS.payer,
        );
        expect(mocks.buildDepositMarginTx).toHaveBeenCalledWith(
            connection,
            TEST_PUBLIC_KEYS.user,
            2500000n,
            {
                actor: TEST_PUBLIC_KEYS.session,
                rentPayer: TEST_PUBLIC_KEYS.payer,
            },
        );
        expect(result).toMatchObject({ success: true, signature: 'sig' });
    });

    it('validates and executes withdraw flows without live margin/RPC calls', async () => {
        const service = new WithdrawService(connection);

        expect(service.validateWithdrawAmount(0.5)).toEqual({
            isValid: false,
            message: 'Invalid withdraw amount',
        });
        const sendTransaction = vi.fn(async () => ({
            signature: 'withdraw-failed',
            error: 'withdraw failed',
        }));
        const result = await service.executeWithdraw(
            3.25,
            TEST_PUBLIC_KEYS.session,
            TEST_PUBLIC_KEYS.user,
            sendTransaction,
        );

        expect(mocks.buildWithdrawMarginTx).toHaveBeenCalledWith(
            connection,
            TEST_PUBLIC_KEYS.user,
            {
                amount: 3250000n,
                actor: TEST_PUBLIC_KEYS.session,
            },
        );
        expect(result).toMatchObject({
            success: false,
            error: 'withdraw failed',
            signature: 'withdraw-failed',
        });
    });

    it('returns failure envelopes when builders or senders throw', async () => {
        mocks.buildDepositMarginTx.mockRejectedValueOnce(
            new Error('build bad'),
        );
        await expect(
            new DepositService(connection).executeDeposit(
                2,
                TEST_PUBLIC_KEYS.session,
                TEST_PUBLIC_KEYS.user,
                sendSuccess(),
            ),
        ).resolves.toMatchObject({
            success: false,
            error: expect.stringContaining('build bad'),
        });

        await expect(
            new WithdrawService(connection).executeWithdraw(
                2,
                TEST_PUBLIC_KEYS.session,
                TEST_PUBLIC_KEYS.user,
                vi.fn(async () => {
                    throw new Error('send bad');
                }),
            ),
        ).resolves.toMatchObject({
            success: false,
            error: 'send bad',
        });
    });
});
