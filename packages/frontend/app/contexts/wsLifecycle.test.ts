import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    WebSocketReadyState,
    WsLifecycleController,
    type WsLike,
} from './wsLifecycle';

class FakeSocket implements WsLike {
    readyState = WebSocketReadyState.CONNECTING;
    onopen: (() => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onmessage: ((event: { data?: any }) => void) | null = null;
    onclose: (() => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onerror: ((error: any) => void) | null = null;
    sent: string[] = [];
    closeCount = 0;

    constructor(readonly url: string) {}

    open() {
        this.readyState = WebSocketReadyState.OPEN;
        this.onopen?.();
    }

    emit(channel: string, data: unknown) {
        this.onmessage?.({ data: JSON.stringify({ channel, data }) });
    }

    send(message: string) {
        this.sent.push(message);
    }

    close() {
        if (this.readyState === WebSocketReadyState.CLOSED) return;

        this.closeCount += 1;
        this.readyState = WebSocketReadyState.CLOSED;
        this.onclose?.();
    }
}

function decodeSent(socket: FakeSocket) {
    return socket.sent.map((message) => JSON.parse(message));
}

function createHarness() {
    const sockets: FakeSocket[] = [];
    const reconnecting: boolean[] = [];
    const readyStates: number[] = [];
    const flags = {
        isClient: true,
        sleepMode: false,
        internetConnected: true,
        isTabActive: true,
    };

    const controller = new WsLifecycleController({
        url: 'wss://example.test/ws',
        createSocket: (url) => {
            const socket = new FakeSocket(url);
            sockets.push(socket);
            return socket;
        },
        getIsClient: () => flags.isClient,
        getSleepMode: () => flags.sleepMode,
        getInternetConnected: () => flags.internetConnected,
        getIsTabActive: () => flags.isTabActive,
        setWsReconnecting: (value) => reconnecting.push(value),
        setReadyState: (state) => readyStates.push(state),
    });

    return { controller, flags, readyStates, reconnecting, sockets };
}

describe('WsLifecycleController', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('connects, opens, and resubscribes existing channels', () => {
        const { controller, readyStates, reconnecting, sockets } =
            createHarness();
        const handler = vi.fn();

        controller.subscribe('l2Book', { handler, payload: { coin: 'BTC' } });
        controller.connect();
        sockets[0].open();

        expect(sockets).toHaveLength(1);
        expect(readyStates).toEqual([
            WebSocketReadyState.CONNECTING,
            WebSocketReadyState.OPEN,
        ]);
        expect(reconnecting).toContain(false);
        expect(decodeSent(sockets[0])).toEqual([
            {
                method: 'subscribe',
                subscription: { type: 'l2Book', coin: 'BTC' },
            },
        ]);
    });

    it('dispatches channel payloads to subscribers and ignores sleep mode', () => {
        const { controller, flags, sockets } = createHarness();
        const handler = vi.fn();

        controller.connect();
        sockets[0].open();
        controller.subscribe('trades', { handler });

        sockets[0].emit('trades', { px: '100000' });
        flags.sleepMode = true;
        sockets[0].emit('trades', { px: '100001' });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith({ px: '100000' });
    });

    it('replaces existing single subscriptions and sends old unsubscribe', () => {
        const { controller, sockets } = createHarness();
        const first = { handler: vi.fn(), payload: { coin: 'BTC' } };
        const second = {
            handler: vi.fn(),
            payload: { coin: 'ETH' },
            single: true,
        };

        controller.connect();
        sockets[0].open();
        controller.subscribe('l2Book', first);
        controller.subscribe('l2Book', second);
        sockets[0].emit('l2Book', { coin: 'ETH' });

        expect(first.handler).not.toHaveBeenCalled();
        expect(second.handler).toHaveBeenCalledWith({ coin: 'ETH' });
        expect(decodeSent(sockets[0]).slice(-2)).toEqual([
            {
                method: 'unsubscribe',
                subscription: { type: 'l2Book', coin: 'BTC' },
            },
            {
                method: 'subscribe',
                subscription: { type: 'l2Book', coin: 'ETH' },
            },
        ]);
    });

    it('unsubscribes one config or a whole channel', () => {
        const { controller, sockets } = createHarness();
        const first = { handler: vi.fn(), payload: { user: 'a' } };
        const second = { handler: vi.fn(), payload: { user: 'b' } };

        controller.connect();
        sockets[0].open();
        controller.subscribe('webData2', first);
        controller.subscribe('webData2', second);
        controller.unsubscribe('webData2', first);
        sockets[0].emit('webData2', { ok: true });
        controller.unsubscribeAllByChannel('webData2');
        sockets[0].emit('webData2', { ok: false });

        expect(first.handler).not.toHaveBeenCalled();
        expect(second.handler).toHaveBeenCalledTimes(1);
        expect(decodeSent(sockets[0]).slice(-2)).toEqual([
            {
                method: 'unsubscribe',
                subscription: { type: 'webData2', user: 'a' },
            },
            {
                method: 'unsubscribe',
                subscription: { type: 'webData2', user: 'b' },
            },
        ]);
    });

    it('schedules close-triggered reconnect with fake timers', () => {
        const { controller, reconnecting, sockets } = createHarness();

        controller.connect();
        sockets[0].open();
        sockets[0].close();

        expect(reconnecting).toContain(true);
        expect(sockets).toHaveLength(1);

        vi.advanceTimersByTime(1000);

        expect(sockets).toHaveLength(2);
        expect(sockets[1].url).toBe('wss://example.test/ws');
    });

    it('defers reconnect while offline or inactive and resumes deterministically', () => {
        const { controller, flags, sockets } = createHarness();

        controller.connect();
        sockets[0].open();

        flags.internetConnected = false;
        sockets[0].close();
        vi.advanceTimersByTime(1000);
        expect(sockets).toHaveLength(1);

        flags.internetConnected = true;
        controller.handleInternetConnectedChange(true);
        expect(sockets).toHaveLength(2);

        sockets[1].open();
        flags.isTabActive = false;
        sockets[1].close();
        vi.advanceTimersByTime(1000);
        expect(sockets).toHaveLength(2);

        flags.isTabActive = true;
        controller.handleTabActiveChange(true);
        expect(sockets).toHaveLength(3);
    });

    it('honors force reconnect and cleanup', () => {
        const { controller, flags, sockets } = createHarness();

        controller.connect();
        sockets[0].open();
        flags.sleepMode = true;
        controller.forceReconnect();
        expect(sockets).toHaveLength(1);

        flags.sleepMode = false;
        controller.forceReconnect();
        expect(sockets).toHaveLength(2);
        expect(sockets[0].closeCount).toBe(1);
        vi.advanceTimersByTime(1000);
        expect(sockets).toHaveLength(2);

        controller.cleanup();
        expect(sockets[1].readyState).toBe(WebSocketReadyState.CLOSED);
        vi.advanceTimersByTime(1000);
        expect(sockets).toHaveLength(2);
    });
});
