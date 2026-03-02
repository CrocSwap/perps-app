import {
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    buildCompleteConversionInstruction,
    buildConnectWalletIx,
    buildConnectWalletInstruction,
    buildFirstTradeInstruction,
    paddedStringToId32,
    sendStandaloneRefregTransactions,
} from './refreg';

const PROGRAM_ID = new PublicKey('J1uNjRVhUCFdRt5K1fnmxGe5uHfqwHkvgWifzwaMN7m');
const AFFILIATE_DATA_STORAGE_KEY = 'AFFILIATE_DATA';

function bytesFromNumber(seed: number): Uint8Array {
    const out = new Uint8Array(32);
    out.fill(seed);
    return out;
}

function createLocalStorageMock(initial: Record<string, string> = {}): Storage {
    const store = new Map<string, string>(Object.entries(initial));

    return {
        get length() {
            return store.size;
        },
        clear() {
            store.clear();
        },
        getItem(key: string) {
            return store.has(key) ? (store.get(key) as string) : null;
        },
        key(index: number) {
            return Array.from(store.keys())[index] ?? null;
        },
        removeItem(key: string) {
            store.delete(key);
        },
        setItem(key: string, value: string) {
            store.set(key, value);
        },
    } as Storage;
}

const originalWindow = (globalThis as { window?: unknown }).window;

function installWindowWithLocalStorage(initial: Record<string, string>): void {
    (globalThis as { window?: unknown }).window = {
        localStorage: createLocalStorageMock(initial),
    };
}

function persistReferralCode(referralCode: string): string {
    return JSON.stringify({
        state: {
            cached: referralCode,
        },
        version: 1,
    });
}

describe('refreg instruction builders', () => {
    beforeEach(() => {
        installWindowWithLocalStorage({});
    });

    afterEach(() => {
        if (originalWindow === undefined) {
            delete (globalThis as { window?: unknown }).window;
            return;
        }
        (globalThis as { window?: unknown }).window = originalWindow;
    });

    it('encodes connect_wallet with tag=1, length=98, canonical-wallet PDA seed, and account order', () => {
        const actor = new PublicKey('11111111111111111111111111111111');
        const payer = new PublicKey(
            'E4fSAVhA2f7hELMzb4UqQz9Sfj1R2fuW9x4rbxruq7as',
        );
        const wallet = new PublicKey(
            '3NgWnYjgV5Uk5ja5uwjL4f8dp9aDraHn6Fu4By8wY6xk',
        );
        const dappId = bytesFromNumber(1);
        const referralId = bytesFromNumber(2);
        const trackingId = bytesFromNumber(3);

        const ix = buildConnectWalletInstruction({
            actor,
            payer,
            walletPublicKey: wallet,
            dappId,
            referralKind: 1,
            referralId,
            trackingId,
        });

        const [expectedRecord] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('connect_wallet'),
                Buffer.from(dappId),
                Buffer.from(trackingId),
                wallet.toBuffer(),
            ],
            PROGRAM_ID,
        );

        expect(ix.programId.toBase58()).toBe(PROGRAM_ID.toBase58());
        expect(ix.data.length).toBe(98);
        expect(ix.data[0]).toBe(1);
        expect(Array.from(ix.data.slice(1, 33))).toEqual(Array.from(dappId));
        expect(ix.data[33]).toBe(1);
        expect(Array.from(ix.data.slice(34, 66))).toEqual(
            Array.from(referralId),
        );
        expect(Array.from(ix.data.slice(66, 98))).toEqual(
            Array.from(trackingId),
        );

        expect(ix.keys).toHaveLength(6);
        expect(ix.keys[0]).toEqual({
            pubkey: actor,
            isSigner: true,
            isWritable: true,
        });
        expect(ix.keys[1]).toEqual({
            pubkey: payer,
            isSigner: true,
            isWritable: true,
        });
        expect(ix.keys[2]).toEqual({
            pubkey: expectedRecord,
            isSigner: false,
            isWritable: true,
        });
        expect(ix.keys[3]).toEqual({
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        });
        expect(ix.keys[4]).toEqual({
            pubkey: SYSVAR_CLOCK_PUBKEY,
            isSigner: false,
            isWritable: false,
        });
        expect(ix.keys[5]).toEqual({
            pubkey: SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        });
    });

    it('encodes first_trade with tag=2, length=33 and canonical-wallet PDA seed', () => {
        const actor = new PublicKey('11111111111111111111111111111111');
        const payer = new PublicKey(
            'E4fSAVhA2f7hELMzb4UqQz9Sfj1R2fuW9x4rbxruq7as',
        );
        const wallet = new PublicKey(
            '4n4VG5orhYkUUFagfXyyCB7cb4f1vU6H6PzF5fS6vrUK',
        );
        const dappId = bytesFromNumber(4);

        const ix = buildFirstTradeInstruction({
            actor,
            payer,
            walletPublicKey: wallet,
            dappId,
        });

        const [expectedRecord] = PublicKey.findProgramAddressSync(
            [
                Buffer.from('first_trade'),
                Buffer.from(dappId),
                wallet.toBuffer(),
            ],
            PROGRAM_ID,
        );

        expect(ix.data.length).toBe(33);
        expect(ix.data[0]).toBe(2);
        expect(Array.from(ix.data.slice(1, 33))).toEqual(Array.from(dappId));
        expect(ix.keys[2].pubkey.toBase58()).toBe(expectedRecord.toBase58());
    });

    it('encodes complete_conversion with tag=0, length=98 and referral PDA seed', () => {
        const actor = new PublicKey('11111111111111111111111111111111');
        const payer = new PublicKey(
            'E4fSAVhA2f7hELMzb4UqQz9Sfj1R2fuW9x4rbxruq7as',
        );
        const wallet = new PublicKey(
            '6i9Y67g9Rz8n6U1Xc4ha3nBnLVEz6tVw4uk8cHnauq6p',
        );
        const dappId = bytesFromNumber(9);
        const referralId = bytesFromNumber(10);
        const trackingId = bytesFromNumber(11);

        const ix = buildCompleteConversionInstruction({
            actor,
            payer,
            walletPublicKey: wallet,
            dappId,
            referralKind: 0,
            referralId,
            trackingId,
        });

        const [expectedRecord] = PublicKey.findProgramAddressSync(
            [Buffer.from('referral'), Buffer.from(dappId), wallet.toBuffer()],
            PROGRAM_ID,
        );

        expect(ix.data.length).toBe(98);
        expect(ix.data[0]).toBe(0);
        expect(ix.data[33]).toBe(0);
        expect(ix.keys[2].pubkey.toBase58()).toBe(expectedRecord.toBase58());
    });

    it('paddedStringToId32 returns left-padded ASCII bytes and rejects invalid input', () => {
        const encoded = paddedStringToId32('abc');
        expect(encoded).toHaveLength(32);
        expect(Array.from(encoded.slice(0, 29))).toEqual(new Array(29).fill(0));
        expect(Array.from(encoded.slice(29))).toEqual([97, 98, 99]);

        expect(() => paddedStringToId32('x'.repeat(33))).toThrow(
            'padded string id must be <= 32 bytes',
        );
        expect(() => paddedStringToId32('abcé')).toThrow(
            'padded string id must be ASCII',
        );
    });

    it('buildConnectWalletIx derives referralKind=0 for base58 public key from AFFILIATE_DATA cache', async () => {
        const referralPubkey = '8iWExR7X3mCG2nLBVmWHAXoJ2Bs8LojRxurx8WcN6iYG';
        installWindowWithLocalStorage({
            [AFFILIATE_DATA_STORAGE_KEY]: persistReferralCode(referralPubkey),
            'fuul.tracking_id': 'E4fSAVhA2f7hELMzb4UqQz9Sfj1R2fuW9x4rbxruq7as',
        });

        const wallet = new PublicKey(
            '3NgWnYjgV5Uk5ja5uwjL4f8dp9aDraHn6Fu4By8wY6xk',
        );
        const actor = new PublicKey('11111111111111111111111111111111');
        const payer = new PublicKey(
            'E4fSAVhA2f7hELMzb4UqQz9Sfj1R2fuW9x4rbxruq7as',
        );

        const result = await buildConnectWalletIx({
            sessionPublicKey: actor,
            walletPublicKey: wallet,
            payerPublicKey: payer,
        });

        expect(result).not.toBeNull();
        expect(result?.referralAttribution.referralKind).toBe(0);
        expect(
            Array.from(result?.referralAttribution.referralId ?? []),
        ).toEqual(Array.from(new PublicKey(referralPubkey).toBytes()));
        expect(result?.instruction.data[33]).toBe(0);
    });

    it('buildConnectWalletIx derives referralKind=1 for non-base58 code from AFFILIATE_DATA cache and front-pads bytes', async () => {
        const referralCode = 'alpha-code';
        installWindowWithLocalStorage({
            [AFFILIATE_DATA_STORAGE_KEY]: persistReferralCode(referralCode),
            'fuul.tracking_id': 'E4fSAVhA2f7hELMzb4UqQz9Sfj1R2fuW9x4rbxruq7as',
        });

        const wallet = new PublicKey(
            '4n4VG5orhYkUUFagfXyyCB7cb4f1vU6H6PzF5fS6vrUK',
        );
        const actor = new PublicKey('11111111111111111111111111111111');
        const payer = new PublicKey(
            'E4fSAVhA2f7hELMzb4UqQz9Sfj1R2fuW9x4rbxruq7as',
        );

        const result = await buildConnectWalletIx({
            sessionPublicKey: actor,
            walletPublicKey: wallet,
            payerPublicKey: payer,
        });

        expect(result).not.toBeNull();
        expect(result?.referralAttribution.referralKind).toBe(1);
        expect(
            Array.from(result?.referralAttribution.referralId ?? []),
        ).toEqual(Array.from(paddedStringToId32(referralCode)));
        expect(result?.instruction.data[33]).toBe(1);
    });

    it('sendStandaloneRefregTransactions sends each instruction as its own tx in sequence', async () => {
        const actor = new PublicKey('11111111111111111111111111111111');
        const payer = new PublicKey(
            'E4fSAVhA2f7hELMzb4UqQz9Sfj1R2fuW9x4rbxruq7as',
        );
        const wallet = new PublicKey(
            '6i9Y67g9Rz8n6U1Xc4ha3nBnLVEz6tVw4uk8cHnauq6p',
        );
        const dappId = bytesFromNumber(21);
        const referralId = bytesFromNumber(22);
        const trackingId = bytesFromNumber(23);

        const firstTradeIx = buildFirstTradeInstruction({
            actor,
            payer,
            walletPublicKey: wallet,
            dappId,
        });
        const completeConversionIx = buildCompleteConversionInstruction({
            actor,
            payer,
            walletPublicKey: wallet,
            dappId,
            referralKind: 1,
            referralId,
            trackingId,
        });

        const sendTransaction = vi
            .fn<(instructions: unknown[]) => Promise<unknown>>()
            .mockResolvedValue({ signature: 'sig' });

        await sendStandaloneRefregTransactions({
            context: 'test',
            walletPublicKey: wallet,
            instructions: [firstTradeIx, completeConversionIx],
            sendTransaction: async (instructions) =>
                sendTransaction(instructions),
        });

        expect(sendTransaction).toHaveBeenCalledTimes(2);
        expect(sendTransaction.mock.calls[0][0]).toEqual([firstTradeIx]);
        expect(sendTransaction.mock.calls[1][0]).toEqual([
            completeConversionIx,
        ]);
    });

    it('sendStandaloneRefregTransactions continues after a send failure', async () => {
        const actor = new PublicKey('11111111111111111111111111111111');
        const payer = new PublicKey(
            'E4fSAVhA2f7hELMzb4UqQz9Sfj1R2fuW9x4rbxruq7as',
        );
        const wallet = new PublicKey(
            '6i9Y67g9Rz8n6U1Xc4ha3nBnLVEz6tVw4uk8cHnauq6p',
        );
        const dappId = bytesFromNumber(31);

        const firstTradeIx = buildFirstTradeInstruction({
            actor,
            payer,
            walletPublicKey: wallet,
            dappId,
        });
        const secondFirstTradeIx = buildFirstTradeInstruction({
            actor,
            payer,
            walletPublicKey: wallet,
            dappId: bytesFromNumber(32),
        });

        const sendTransaction = vi
            .fn<(instructions: unknown[]) => Promise<unknown>>()
            .mockRejectedValueOnce(new Error('send failed'))
            .mockResolvedValueOnce({ signature: 'sig-2' });

        await sendStandaloneRefregTransactions({
            context: 'test',
            walletPublicKey: wallet,
            instructions: [firstTradeIx, secondFirstTradeIx],
            sendTransaction: async (instructions) =>
                sendTransaction(instructions),
        });

        expect(sendTransaction).toHaveBeenCalledTimes(2);
    });
});
