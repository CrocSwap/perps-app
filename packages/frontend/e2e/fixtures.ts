import { expect, test as base, type Page, type Route } from '@playwright/test';

type JsonValue =
    | null
    | boolean
    | number
    | string
    | JsonValue[]
    | { [key: string]: JsonValue };

const LOCALHOSTS = new Set(['127.0.0.1', 'localhost']);
const ALLOWED_CONSOLE_ERROR_PATTERNS = [
    /favicon/i,
    /ResizeObserver loop/i,
    /Download the React DevTools/i,
    /Failed to load resource/i,
    /Cannot update a component .* while rendering a different component/i,
    /cannot contain a nested/i,
    /In HTML, .* cannot be a descendant/i,
    /Failed to load TradingView script/i,
];

const marketUniverse = [
    {
        name: 'BTC',
        szDecimals: 5,
        maxLeverage: 50,
    },
];

const marketAssetCtxs = [
    {
        dayBaseVlm: '123.45',
        dayNtlVlm: '12345000',
        funding: '0.0001',
        impactPxs: ['99900', '100100'],
        markPx: '100000',
        midPx: '100000',
        openInterest: '12.5',
        oraclePx: '100000',
        premium: '0',
        prevDayPx: '99000',
    },
];

function candleSnapshotResponse(route: Route) {
    const postData = postDataJSON(route) as {
        req?: { coin?: string; startTime?: number; endTime?: number };
    };
    const endTime = postData.req?.endTime ?? Date.UTC(2026, 0, 1);
    const intervalMs = 60 * 60 * 1000;
    const firstTime = endTime - intervalMs * 4;
    const coin = postData.req?.coin ?? 'BTC';

    return jsonResponse(
        Array.from({ length: 5 }, (_, index) => {
            const price = 100000 + index * 100;

            return {
                T: firstTime + index * intervalMs + intervalMs - 1,
                c: String(price + 50),
                h: String(price + 100),
                i: '1h',
                l: String(price - 100),
                n: index + 1,
                o: String(price),
                s: coin,
                t: firstTime + index * intervalMs,
                v: String(10 + index),
            };
        }),
    );
}

function jsonResponse(body: JsonValue, status = 200) {
    return {
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
    };
}

function postDataJSON(route: Route): { type?: string; id?: JsonValue } {
    try {
        return route.request().postDataJSON() as {
            type?: string;
            id?: JsonValue;
        };
    } catch {
        return {};
    }
}

function hyperliquidInfoResponse(route: Route) {
    const postData = postDataJSON(route);

    switch (postData.type) {
        case 'l2Book':
            return jsonResponse({
                coin: 'BTC',
                time: Date.UTC(2026, 0, 1),
                levels: [
                    [
                        { px: '99950', sz: '1.25', n: 2 },
                        { px: '99900', sz: '0.75', n: 1 },
                    ],
                    [
                        { px: '100050', sz: '1.1', n: 2 },
                        { px: '100100', sz: '0.9', n: 1 },
                    ],
                ],
            });
        case 'meta':
            return jsonResponse({ universe: marketUniverse });
        case 'metaAndAssetCtxs':
            return jsonResponse([
                { universe: marketUniverse },
                marketAssetCtxs,
            ]);
        case 'candleSnapshot':
            return candleSnapshotResponse(route);
        case 'allMids':
            return jsonResponse({ mids: { BTC: '100000' } });
        case 'spotMeta':
            return jsonResponse({
                tokens: [
                    {
                        name: 'UBTC',
                        szDecimals: 5,
                        weiDecimals: 8,
                        index: 0,
                        tokenId: '0xbtc',
                        isCanonical: true,
                    },
                ],
                universe: [],
            });
        case 'tokenDetails':
            return jsonResponse({
                name: 'BTC',
                maxSupply: '0',
                totalSupply: '0',
                circulatingSupply: '0',
                szDecimals: 5,
                weiDecimals: 8,
                midPx: '0',
                markPx: '0',
                prevDayPx: '0',
            });
        case 'frontendOpenOrders':
        case 'historicalOrders':
        case 'userFills':
        case 'twapHistory':
        case 'userTwapSliceFills':
        case 'userFunding':
        case 'portfolio':
        case 'userNonFundingLedgerUpdates':
            return jsonResponse([]);
        default:
            return jsonResponse([]);
    }
}

function fuulResponse(url: URL) {
    if (url.pathname.includes('/payouts/movements')) {
        return jsonResponse({
            total_results: 0,
            page: 1,
            page_size: 10,
            results: [],
        });
    }

    if (
        url.pathname.includes('/payouts/by-referrer') ||
        url.pathname.includes('/payouts/leaderboard') ||
        url.pathname.includes('/claim-checks/claim')
    ) {
        return jsonResponse([]);
    }

    if (url.pathname.includes('/user/referrer')) {
        return jsonResponse({ referrer_identifier: '' });
    }

    return jsonResponse({});
}

function pythResponse() {
    const publishTime = Math.floor(Date.now() / 1000);

    return jsonResponse({
        binary: {
            encoding: 'hex',
            data: [],
        },
        parsed: [
            {
                id: 'btc',
                metadata: {},
                price: {
                    price: '100000',
                    expo: -3,
                    conf: '100',
                    publish_time: publishTime,
                },
                ema_price: {
                    price: '100000',
                    expo: -3,
                    conf: '100',
                    publish_time: publishTime,
                },
            },
        ],
    });
}

async function installProviderMocks(page: Page, baseURL?: string) {
    await page.addInitScript(() => {
        class MockWebSocket extends EventTarget {
            static CONNECTING = 0;
            static OPEN = 1;
            static CLOSING = 2;
            static CLOSED = 3;

            readonly url: string;
            readyState = MockWebSocket.CONNECTING;
            onopen: ((event: Event) => void) | null = null;
            onclose: ((event: CloseEvent) => void) | null = null;
            onerror: ((event: Event) => void) | null = null;
            onmessage: ((event: MessageEvent) => void) | null = null;

            constructor(url: string) {
                super();
                this.url = url;
                window.setTimeout(() => {
                    this.readyState = MockWebSocket.OPEN;
                    const event = new Event('open');
                    this.onopen?.(event);
                    this.dispatchEvent(event);
                }, 0);
            }

            send() {
                return undefined;
            }

            close() {
                if (this.readyState === MockWebSocket.CLOSED) return;

                this.readyState = MockWebSocket.CLOSED;
                const event = new CloseEvent('close');
                this.onclose?.(event);
                this.dispatchEvent(event);
            }
        }

        window.WebSocket = MockWebSocket as unknown as typeof WebSocket;
    });

    await page.route('**/*', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const appOrigin = baseURL ? new URL(baseURL).origin : undefined;

        if (url.pathname === '/version.json') {
            await route.fulfill(
                jsonResponse({
                    version: 'smoke-test',
                    timestamp: new Date(0).toISOString(),
                }),
            );
            return;
        }

        if (url.pathname === '/announcements.json') {
            await route.fulfill(jsonResponse({ news: [] }));
            return;
        }

        if (url.pathname === '/.netlify/functions/show-country') {
            await route.fulfill(jsonResponse({ country: 'US' }));
            return;
        }

        if (
            url.origin === appOrigin ||
            LOCALHOSTS.has(url.hostname) ||
            url.protocol === 'data:' ||
            url.protocol === 'blob:'
        ) {
            await route.continue();
            return;
        }

        if (url.hostname.includes('api.fuul.xyz')) {
            await route.fulfill(fuulResponse(url));
            return;
        }

        if (url.hostname.includes('pyth.network')) {
            await route.fulfill(pythResponse());
            return;
        }

        if (url.hostname.includes('stats-data.hyperliquid.xyz')) {
            await route.fulfill(jsonResponse([]));
            return;
        }

        if (
            url.hostname.includes('hyperliquid') ||
            url.hostname.includes('liquidity.tools')
        ) {
            await route.fulfill(hyperliquidInfoResponse(route));
            return;
        }

        if (url.hostname.includes('testnet.fogo.io')) {
            const postData = postDataJSON(route);
            await route.fulfill(
                jsonResponse({
                    jsonrpc: '2.0',
                    id: postData.id ?? 1,
                    result: null,
                }),
            );
            return;
        }

        if (
            request.resourceType() === 'fetch' ||
            request.resourceType() === 'xhr'
        ) {
            await route.fulfill(jsonResponse({}));
            return;
        }

        await route.abort();
    });
}

export const test = base.extend<{ page: Page }>({
    page: async ({ page, baseURL }, use) => {
        const runtimeErrors: string[] = [];

        page.on('console', (message) => {
            if (message.type() !== 'error') return;

            const text = message.text();
            const isAllowed = ALLOWED_CONSOLE_ERROR_PATTERNS.some((pattern) =>
                pattern.test(text),
            );
            if (!isAllowed) runtimeErrors.push(`console.error: ${text}`);
        });

        page.on('pageerror', (error) => {
            runtimeErrors.push(`pageerror: ${error.message}`);
        });

        await installProviderMocks(page, baseURL);
        await use(page);

        expect(runtimeErrors).toEqual([]);
    },
});

export { expect } from '@playwright/test';
