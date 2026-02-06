import {
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import {
    buildCompleteConversionInstruction,
    buildConnectWalletInstruction,
    buildFirstTradeInstruction,
    paddedStringToId32,
} from './refreg';

const PROGRAM_ID = new PublicKey('J1uNjRVhUCFdRt5K1fnmxGe5uHfqwHkvgWifzwaMN7m');

function bytesFromNumber(seed: number): Uint8Array {
    const out = new Uint8Array(32);
    out.fill(seed);
    return out;
}

describe('refreg instruction builders', () => {
    it('encodes connect_wallet with tag=1, length=98, canonical-wallet PDA seed, and account order', () => {
        const actor = new PublicKey('11111111111111111111111111111111');
        const wallet = new PublicKey(
            '3NgWnYjgV5Uk5ja5uwjL4f8dp9aDraHn6Fu4By8wY6xk',
        );
        const dappId = bytesFromNumber(1);
        const referralId = bytesFromNumber(2);
        const trackingId = bytesFromNumber(3);

        const ix = buildConnectWalletInstruction({
            actor,
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

        expect(ix.keys).toHaveLength(5);
        expect(ix.keys[0]).toEqual({
            pubkey: actor,
            isSigner: true,
            isWritable: true,
        });
        expect(ix.keys[1]).toEqual({
            pubkey: expectedRecord,
            isSigner: false,
            isWritable: true,
        });
        expect(ix.keys[2]).toEqual({
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
        });
        expect(ix.keys[3]).toEqual({
            pubkey: SYSVAR_CLOCK_PUBKEY,
            isSigner: false,
            isWritable: false,
        });
        expect(ix.keys[4]).toEqual({
            pubkey: SYSVAR_RENT_PUBKEY,
            isSigner: false,
            isWritable: false,
        });
    });

    it('encodes first_trade with tag=2, length=33 and canonical-wallet PDA seed', () => {
        const actor = new PublicKey('11111111111111111111111111111111');
        const wallet = new PublicKey(
            '4n4VG5orhYkUUFagfXyyCB7cb4f1vU6H6PzF5fS6vrUK',
        );
        const dappId = bytesFromNumber(4);

        const ix = buildFirstTradeInstruction({
            actor,
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
        expect(ix.keys[1].pubkey.toBase58()).toBe(expectedRecord.toBase58());
    });

    it('encodes complete_conversion with tag=0, length=98 and referral PDA seed', () => {
        const actor = new PublicKey('11111111111111111111111111111111');
        const wallet = new PublicKey(
            '6i9Y67g9Rz8n6U1Xc4ha3nBnLVEz6tVw4uk8cHnauq6p',
        );
        const dappId = bytesFromNumber(9);
        const referralId = bytesFromNumber(10);
        const trackingId = bytesFromNumber(11);

        const ix = buildCompleteConversionInstruction({
            actor,
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
        expect(ix.keys[1].pubkey.toBase58()).toBe(expectedRecord.toBase58());
    });

    it('paddedStringToId32 returns right-padded utf8 bytes and rejects > 32 bytes', () => {
        const encoded = paddedStringToId32('abc');
        expect(encoded).toHaveLength(32);
        expect(Array.from(encoded.slice(0, 3))).toEqual([97, 98, 99]);
        expect(Array.from(encoded.slice(3))).toEqual(new Array(29).fill(0));

        expect(() => paddedStringToId32('x'.repeat(33))).toThrow(
            'padded string id must be <= 32 bytes',
        );
    });
});
