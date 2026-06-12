import { describe, expect, it } from 'vitest';
import { processPosition } from './processPosition';
import { processSymbolInfo } from './processSymbolInfo';
import { processUserBalance, sortUserBalances } from './processUserBalance';
import {
    processDepositWithdrawal,
    processUserActiveTwap,
    processUserFills,
    processUserFundings,
    processUserTwapHistory,
    processUserTwapSliceFills,
    sortUserFills,
} from './processUserFills';
import { processVaultDetails } from './processVault';

describe('user data processors', () => {
    it('normalizes position numeric fields', () => {
        expect(
            processPosition({
                type: 'oneWay',
                position: {
                    coin: 'BTC',
                    entryPx: '100',
                    leverage: { type: 'cross', value: '5' },
                    liquidationPx: '50',
                    marginUsed: '20',
                    maxLeverage: '50',
                    positionValue: '500',
                    returnOnEquity: '0.1',
                    szi: '2',
                    unrealizedPnl: '-3.5',
                    cumFunding: {
                        allTime: '1',
                        sinceChange: '2',
                        sinceOpen: '3',
                    },
                },
            }),
        ).toMatchObject({
            coin: 'BTC',
            entryPx: 100,
            leverage: { type: 'cross', value: 5 },
            liquidationPx: 50,
            marginUsed: 20,
            positionValue: 500,
            unrealizedPnl: -3.5,
            cumFunding: { allTime: 1, sinceChange: 2, sinceOpen: 3 },
        });
    });

    it('normalizes symbol info and returns an empty object for malformed payloads', () => {
        const symbol = processSymbolInfo({
            coin: 'BTC',
            szDecimals: 5,
            maxLeverage: 50,
            ctx: {
                dayBaseVlm: '10',
                dayNtlVlm: '200',
                funding: '0.01',
                impactPxs: ['99', '101'],
                markPx: '110',
                midPx: '109',
                openInterest: '3',
                oraclePx: '100',
                premium: '0.1',
                prevDayPx: '100',
            },
        } as never);

        expect(symbol).toMatchObject({
            coin: 'BTC',
            markPx: 110,
            last24hPriceChange: 10,
            last24hPriceChangePercent: 10,
            openInterestDollarized: 300,
            impactPxs: [99, 101],
        });
        expect(processSymbolInfo({} as never)).toEqual({});
    });

    it('normalizes balances and sorts USDC first by sortName', () => {
        const prices = new Map([
            ['USDC', 1],
            ['BTC', 20000],
        ]);
        const usdc = processUserBalance(
            { coin: 'USDC', total: '10', hold: '2', entryNtl: '9', token: 0 },
            'spot',
            prices,
        );
        const ubtc = processUserBalance(
            {
                coin: 'UBTC',
                total: '0.5',
                hold: '0.1',
                entryNtl: '9000',
                token: 1,
            },
            'spot',
            prices,
        );

        expect(usdc).toMatchObject({
            coin: 'USDC',
            sortName: '\x01',
            total: 10,
            available: 8,
            usdcValue: 10,
            pnlValue: 1,
        });
        expect(ubtc).toMatchObject({
            coin: 'BTC',
            available: 0.4,
            usdcValue: 10000,
            pnlValue: 1000,
        });
        expect(sortUserBalances([ubtc, usdc], 'sortName', 'asc')[0]).toBe(usdc);
    });

    it('deduplicates fills and sorts by requested fields', () => {
        const fills = processUserFills({
            fills: [
                {
                    time: 2,
                    coin: 'BTC',
                    crossed: true,
                    dir: 'Open Long',
                    hash: 'h1',
                    oid: 1,
                    px: '100',
                    side: 'B',
                    sz: '2',
                    tid: 10,
                    fee: '0.1',
                    closedPnl: '0',
                    startPosition: '0',
                },
                {
                    time: 3,
                    coin: 'BTC',
                    crossed: true,
                    dir: 'Open Long',
                    hash: 'h2',
                    oid: 1,
                    px: '100',
                    side: 'B',
                    sz: '2',
                    tid: 11,
                    fee: '0.1',
                    closedPnl: '0',
                    startPosition: '0',
                },
                {
                    time: 1,
                    coin: 'ETH',
                    crossed: false,
                    dir: 'Close Short',
                    hash: 'h3',
                    oid: 2,
                    px: '10',
                    side: 'A',
                    sz: '3',
                    tid: 12,
                    fee: '0.2',
                    closedPnl: '-1.5',
                },
            ],
        } as never);

        expect(fills).toHaveLength(2);
        expect(fills[0]).toMatchObject({
            side: 'buy',
            value: 200,
            startPosition: 0,
        });
        expect(fills[1]).toMatchObject({
            side: 'sell',
            value: 30,
            closedPnl: -1.5,
        });
        expect(
            sortUserFills([...fills], 'time', 'asc').map((f) => f.coin),
        ).toEqual(['ETH', 'BTC']);
    });

    it('normalizes twap, funding, ledger, and vault payloads', () => {
        expect(
            processUserTwapSliceFills({
                twapSliceFills: [
                    {
                        twapId: 7,
                        fill: {
                            coin: 'BTC',
                            closedPnl: '1',
                            crossed: true,
                            dir: 'Open',
                            fee: '0.01',
                            feeToken: 'USDC',
                            hash: 'h',
                            oid: 1,
                            px: '100',
                            side: 'A',
                            startPosition: '0',
                            sz: '2',
                            tid: 3,
                            time: 4,
                        },
                    },
                ],
            } as never)[0],
        ).toMatchObject({ twapId: 7, side: 'sell', px: 100, sz: 2 });

        expect(
            processUserTwapHistory({
                history: [
                    {
                        state: {
                            coin: 'BTC',
                            executedNtl: '100',
                            executedSz: '2',
                            minutes: 10,
                            randomize: false,
                            reduceOnly: true,
                            side: 'B',
                            sz: '3',
                            timestamp: 5,
                            user: 'user',
                        },
                        status: { status: 'finished' },
                        time: 6,
                    },
                ],
            } as never)[0],
        ).toMatchObject({
            state: { side: 'buy', executedNtl: 100, executedSz: 2, sz: 3 },
            status: 'finished',
        });

        expect(
            processUserActiveTwap({
                coin: 'BTC',
                executedNtl: '100',
                executedSz: '1',
                minutes: 5,
                randomize: true,
                reduceOnly: false,
                side: 'A',
                sz: '2',
                timestamp: 9,
                user: 'u',
            } as never),
        ).toMatchObject({ side: 'sell', executedNtl: 100, executedSz: 1 });

        expect(
            processUserFundings([
                {
                    time: 1,
                    coin: 'BTC',
                    usdc: '1.2',
                    szi: '-0.3',
                    fundingRate: '0.01',
                },
            ] as never)[0],
        ).toMatchObject({ usdc: 1.2, szi: -0.3, fundingRate: 0.01 });

        expect(
            processDepositWithdrawal([
                {
                    time: 1,
                    status: 'complete',
                    network: 'solana',
                    action: 'deposit',
                    valueChange: '10',
                    fee: '0.1',
                },
            ] as never)[0],
        ).toMatchObject({ action: 'deposit', valueChange: '10' });

        expect(
            processVaultDetails({
                allowDeposits: true,
                apr: 1,
                description: 'd',
                isClosed: false,
                leader: 'leader',
                leaderCommission: 0,
                leaderFraction: 0,
                maxDistributable: 1,
                maxWithdrawable: 1,
                name: 'vault',
                vaultAddress: 'addr',
                followerState: null,
                followers: [
                    {
                        allTimePnl: '1',
                        daysFollowing: 2,
                        lockupUntil: 3,
                        pnl: '4',
                        user: 'u',
                        vaultEntryTime: 5,
                        vaultEquity: '6',
                    },
                ],
                portfolio: [
                    [
                        1,
                        {
                            accountValueHistory: [[1, '2']],
                            pnlHistory: [[3, '4']],
                            vlm: '5',
                        },
                    ],
                ],
                relationship: { type: 'none' },
            } as never),
        ).toMatchObject({ tvl: 6, pnl: 4, followers: [{ vaultEquity: 6 }] });
    });
});
