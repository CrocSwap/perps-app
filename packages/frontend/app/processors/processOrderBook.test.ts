import { describe, expect, it, beforeEach } from 'vitest';
import {
    processOrderBookMessage,
    processTrades,
    processUserOrder,
} from './processOrderBook';
import { useTradeDataStore } from '~/stores/TradeDataStore';

describe('processOrderBookMessage', () => {
    it('returns empty sides when levels are missing', () => {
        expect(processOrderBookMessage(undefined as never)).toEqual({
            sells: [],
            buys: [],
        });
    });

    it('parses levels and computes cumulative ratios', () => {
        const result = processOrderBookMessage({
            coin: 'BTC',
            levels: [
                [
                    { px: '100', sz: '2', n: 1 },
                    { px: '99', sz: '3', n: 2 },
                ],
                [{ px: '101', sz: '4', n: 1 }],
            ],
        } as never);

        expect(result.buys).toMatchObject([
            { coin: 'BTC', px: 100, sz: 2, n: 1, total: 2, ratio: 0.4 },
            { coin: 'BTC', px: 99, sz: 3, n: 2, total: 5, ratio: 1 },
        ]);
        expect(result.sells).toMatchObject([
            { coin: 'BTC', px: 101, sz: 4, n: 1, total: 4, ratio: 0.8 },
        ]);
    });
});

describe('processTrades', () => {
    it('normalizes SDK trade sides and numeric fields', () => {
        expect(
            processTrades([
                {
                    coin: 'BTC',
                    side: 'A',
                    px: '100.1',
                    sz: '0.2',
                    hash: 'h1',
                    time: 1,
                    tid: 2,
                    users: ['u'],
                },
                {
                    coin: 'ETH',
                    side: 'B',
                    px: '10',
                    sz: '1.5',
                    hash: 'h2',
                    time: 3,
                    tid: 4,
                    users: [],
                },
            ]),
        ).toMatchObject([
            { coin: 'BTC', side: 'sell', px: 100.1, sz: 0.2 },
            { coin: 'ETH', side: 'buy', px: 10, sz: 1.5 },
        ]);
    });
});

describe('processUserOrder', () => {
    beforeEach(() => {
        useTradeDataStore.setState({
            symbolInfo: { coin: 'BTC', markPx: 25000 } as never,
        });
    });

    it('normalizes raw open orders and derives filled size and value', () => {
        const result = processUserOrder(
            {
                coin: 'BTC',
                side: 'A',
                sz: '0.25',
                origSz: '1.00',
                oid: 123,
                limitPx: '26000.5',
                tif: 'Gtc',
                timestamp: 99,
                reduceOnly: true,
                isPositionTpsl: true,
                isTrigger: true,
                triggerPx: '25500',
                triggerCondition: 'above',
                orderType: 'Take Profit',
            } as never,
            'open',
        );

        expect(result).toMatchObject({
            coin: 'BTC',
            oid: 123,
            side: 'sell',
            sz: 0.25,
            limitPx: 26000.5,
            origSz: 1,
            filledSz: 0.75,
            orderValue: 6250,
            reduceOnly: true,
            isPositionTpsl: true,
            isTrigger: true,
            triggerPx: 25500,
            triggerCondition: 'above',
            orderType: 'Take Profit',
            status: 'open',
        });
    });

    it('returns null for unknown sides instead of emitting malformed rows', () => {
        expect(
            processUserOrder(
                {
                    coin: 'BTC',
                    side: 'unknown',
                    sz: '1',
                    origSz: '1',
                    oid: 1,
                    limitPx: '1',
                } as never,
                'open',
            ),
        ).toBeNull();
    });
});
