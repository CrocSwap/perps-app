import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadWorkerModule } from '~/test-utils/workerHarness';

describe('webdata2.worker', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('posts normalized market and user data', async () => {
        const worker = await loadWorkerModule(
            '../hooks/workers/webdata2.worker',
        );

        worker.onmessage({
            data: {
                channel: 'webData2',
                data: {
                    user: 'user-1',
                    meta: {
                        universe: [
                            {
                                name: 'BTC',
                                szDecimals: 5,
                                maxLeverage: 50,
                            },
                        ],
                    },
                    assetCtxs: [
                        {
                            dayBaseVlm: '10',
                            dayNtlVlm: '200',
                            funding: '0.01',
                            impactPxs: ['99', '101'],
                            markPx: '100',
                            midPx: '100',
                            openInterest: '3',
                            oraclePx: '100',
                            premium: '0.1',
                            prevDayPx: '90',
                        },
                    ],
                    openOrders: [
                        {
                            coin: 'BTC',
                            side: 'B',
                            sz: '1',
                            origSz: '2',
                            oid: 10,
                            limitPx: '99',
                            tif: 'Gtc',
                            timestamp: 1,
                            reduceOnly: false,
                        },
                    ],
                    clearinghouseState: {
                        assetPositions: [
                            {
                                type: 'oneWay',
                                position: {
                                    coin: 'BTC',
                                    entryPx: '80',
                                    leverage: { type: 'cross', value: '5' },
                                    liquidationPx: '40',
                                    marginUsed: '20',
                                    maxLeverage: '50',
                                    positionValue: '100',
                                    returnOnEquity: '0.1',
                                    szi: '1',
                                    unrealizedPnl: '5',
                                    cumFunding: {
                                        allTime: '1',
                                        sinceChange: '2',
                                        sinceOpen: '3',
                                    },
                                },
                            },
                        ],
                        marginSummary: {
                            accountValue: '1000',
                            totalMarginUsed: '100',
                        },
                        crossMaintenanceMarginUsed: '50',
                    },
                    twapStates: [
                        [
                            'twap-1',
                            {
                                coin: 'BTC',
                                executedNtl: '100',
                                executedSz: '1',
                                minutes: 5,
                                randomize: false,
                                reduceOnly: false,
                                side: 'A',
                                sz: '2',
                                timestamp: 9,
                                user: 'user-1',
                            },
                        ],
                    ],
                    spotState: {
                        balances: [
                            {
                                coin: 'USDC',
                                total: '10',
                                hold: '2',
                                entryNtl: '9',
                                token: 0,
                            },
                        ],
                    },
                },
            },
        } as MessageEvent);

        const message = worker.postMessage.mock.calls[0][0];
        expect(message.channel).toBe('webData2');
        expect(message.data.user).toBe('user-1');
        expect(message.data.coins).toHaveLength(1);
        expect(message.data.userOpenOrders[0]).toMatchObject({
            coin: 'BTC',
            side: 'buy',
            sz: 1,
            filledSz: 1,
        });
        expect(message.data.positions[0]).toMatchObject({
            coin: 'BTC',
            unrealizedPnl: 5,
        });
        expect(message.data.userBalances).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ coin: 'USDC', type: 'margin' }),
                expect.objectContaining({ coin: 'USDC', type: 'spot' }),
            ]),
        );
        expect(message.data.accountOverview).toMatchObject({
            balance: 1000,
            unrealizedPnl: 5,
            maintainanceMargin: 50,
            crossMarginRatio: 5,
            crossAccountLeverage: 0.1,
        });
        expect(message.data.activeTwaps[0]).toMatchObject({
            coin: 'BTC',
            side: 'sell',
        });
        expect(message.data.coinPriceMap.get('BTC')).toBe(100);
    });

    it('posts an error envelope for malformed messages', async () => {
        const worker = await loadWorkerModule(
            '../hooks/workers/webdata2.worker',
        );

        worker.onmessage({
            data: { channel: 'webData2', data: null },
        } as MessageEvent);

        expect(worker.postMessage).toHaveBeenCalledWith({
            error: expect.any(String),
        });
    });
});
