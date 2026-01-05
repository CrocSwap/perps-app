import { describe, it, expect, vi, afterEach } from 'vitest';

// Use relative import to avoid relying on tsconfig path aliases in tests

const importConstants = async () => {
    return await import('./Constants');
};

afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
});

describe('getTxLink', () => {
    it('returns undefined when signature is null or empty', async () => {
        const { getTxLink } = await importConstants();

        expect(getTxLink()).toBeUndefined();
        expect(getTxLink('')).toBeUndefined();
        expect(getTxLink(null as unknown as string)).toBeUndefined();
    });

    it('uses default block explorer and adds testnet query param when IS_TESTNET=true', async () => {
        vi.stubEnv('VITE_NETWORK', 'testnet');
        vi.resetModules();
        const { getTxLink } = await import('./Constants');

        expect(getTxLink('abc123')).toBe(
            'https://fogoscan.com/tx/abc123?cluster=testnet',
        );
    });

    it('uses default block explorer without query param when IS_TESTNET=false (mainnet)', async () => {
        vi.stubEnv('VITE_NETWORK', 'mainnet');
        vi.resetModules();
        const { getTxLink } = await import('./Constants');

        expect(getTxLink('abc123')).toBe('https://fogoscan.com/tx/abc123');
    });

    it('respects custom VITE_BLOCK_EXPLORER env var', async () => {
        vi.stubEnv('VITE_NETWORK', 'mainnet');
        vi.stubEnv('VITE_BLOCK_EXPLORER', 'https://customscan.io');
        vi.resetModules();
        const { getTxLink } = await import('./Constants');

        expect(getTxLink('def456')).toBe('https://customscan.io/tx/def456');
    });
});
