import {
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';

const REFREG_PROGRAM_ID = new PublicKey(
    'J1uNjRVhUCFdRt5K1fnmxGe5uHfqwHkvgWifzwaMN7m',
);
const DAPP_ID = new PublicKey('ambi3LHRUzmU187u4rP46rX6wrYrLtU1Bmi5U2yCTGE');
const REFERRAL_SEED_PREFIX = new TextEncoder().encode('referral');
const CONNECT_WALLET_SEED_PREFIX = new TextEncoder().encode('connect_wallet');
const FIRST_TRADE_SEED_PREFIX = new TextEncoder().encode('first_trade');
const REFERRAL_ID_STORAGE_KEY = 'referral_id';
const TRACKING_ID_STORAGE_KEY = 'fuul.tracking_id';

const COMPLETE_CONVERSION_TAG = 0;
const CONNECT_WALLET_TAG = 1;
const FIRST_TRADE_TAG = 2;
const REFERRAL_KIND_HASH = 1;

type BuildIxParams = {
    sessionPublicKey: PublicKey;
    walletPublicKey: PublicKey;
};

function readLocalStorage(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(key);
    } catch (error) {
        console.info('[refreg] localStorage access failed:', error);
        return null;
    }
}

function parseBase58ToBytes(value: string): Uint8Array | null {
    try {
        const key = new PublicKey(value);
        return key.toBytes();
    } catch (error) {
        console.info('[refreg] Invalid base58 value:', value);
        return null;
    }
}

async function sha256Bytes(value: string): Promise<Uint8Array | null> {
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        console.info('[refreg] crypto.subtle not available');
        return null;
    }
    try {
        const bytes = new TextEncoder().encode(value);
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        return new Uint8Array(digest);
    } catch (error) {
        console.info('[refreg] Failed to hash tracking id:', error);
        return null;
    }
}

async function getTrackingIdHash(): Promise<Uint8Array | null> {
    const trackingIdRaw = readLocalStorage(TRACKING_ID_STORAGE_KEY);
    if (!trackingIdRaw) {
        console.info('[refreg] tracking_id missing');
        return null;
    }

    const trackingIdBytes = await sha256Bytes(trackingIdRaw);
    if (!trackingIdBytes || trackingIdBytes.length !== 32) {
        console.info('[refreg] invalid tracking_id');
        return null;
    }

    return trackingIdBytes;
}

function getReferralIdBytes(): Uint8Array | null {
    const referralIdRaw = readLocalStorage(REFERRAL_ID_STORAGE_KEY);
    if (!referralIdRaw) {
        console.info('[refreg] Skipping conversion: referral_id missing');
        return null;
    }

    const referralIdBytes = parseBase58ToBytes(referralIdRaw);
    if (!referralIdBytes || referralIdBytes.length !== 32) {
        console.info('[refreg] Skipping conversion: invalid referral_id');
        return null;
    }

    return referralIdBytes;
}

function buildCompleteConversionIxWithBytes(
    params: BuildIxParams,
    referralIdBytes: Uint8Array,
    trackingIdBytes: Uint8Array,
): TransactionInstruction {
    try {
        const [referralRecord] = PublicKey.findProgramAddressSync(
            [
                REFERRAL_SEED_PREFIX,
                DAPP_ID.toBytes(),
                params.walletPublicKey.toBytes(),
            ],
            REFREG_PROGRAM_ID,
        );

        const data = new Uint8Array(98);
        data[0] = COMPLETE_CONVERSION_TAG;
        data.set(DAPP_ID.toBytes(), 1);
        data[33] = REFERRAL_KIND_HASH;
        data.set(referralIdBytes, 34);
        data.set(trackingIdBytes, 66);

        return new TransactionInstruction({
            programId: REFREG_PROGRAM_ID,
            keys: [
                {
                    pubkey: params.sessionPublicKey,
                    isSigner: true,
                    isWritable: true,
                },
                { pubkey: referralRecord, isSigner: false, isWritable: true },
                {
                    pubkey: SystemProgram.programId,
                    isSigner: false,
                    isWritable: false,
                },
                {
                    pubkey: SYSVAR_CLOCK_PUBKEY,
                    isSigner: false,
                    isWritable: false,
                },
                {
                    pubkey: SYSVAR_RENT_PUBKEY,
                    isSigner: false,
                    isWritable: false,
                },
            ],
            data: Buffer.from(data),
        });
    } catch (error) {
        throw error;
    }
}

function buildConnectWalletIxWithBytes(
    params: BuildIxParams,
    trackingIdBytes: Uint8Array,
): TransactionInstruction {
    const [record] = PublicKey.findProgramAddressSync(
        [
            CONNECT_WALLET_SEED_PREFIX,
            DAPP_ID.toBytes(),
            trackingIdBytes,
            params.walletPublicKey.toBytes(),
        ],
        REFREG_PROGRAM_ID,
    );

    const data = new Uint8Array(65);
    data[0] = CONNECT_WALLET_TAG;
    data.set(DAPP_ID.toBytes(), 1);
    data.set(trackingIdBytes, 33);

    return new TransactionInstruction({
        programId: REFREG_PROGRAM_ID,
        keys: [
            {
                pubkey: params.sessionPublicKey,
                isSigner: true,
                isWritable: true,
            },
            { pubkey: record, isSigner: false, isWritable: true },
            {
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false,
            },
            { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(data),
    });
}

function buildFirstTradeIx(params: BuildIxParams): TransactionInstruction {
    const [record] = PublicKey.findProgramAddressSync(
        [
            FIRST_TRADE_SEED_PREFIX,
            DAPP_ID.toBytes(),
            params.walletPublicKey.toBytes(),
        ],
        REFREG_PROGRAM_ID,
    );

    const data = new Uint8Array(33);
    data[0] = FIRST_TRADE_TAG;
    data.set(DAPP_ID.toBytes(), 1);

    return new TransactionInstruction({
        programId: REFREG_PROGRAM_ID,
        keys: [
            {
                pubkey: params.sessionPublicKey,
                isSigner: true,
                isWritable: true,
            },
            { pubkey: record, isSigner: false, isWritable: true },
            {
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false,
            },
            { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(data),
    });
}

export async function buildConnectWalletIx(
    params: BuildIxParams,
): Promise<TransactionInstruction | null> {
    try {
        const trackingIdBytes = await getTrackingIdHash();
        if (!trackingIdBytes) {
            return null;
        }

        return buildConnectWalletIxWithBytes(params, trackingIdBytes);
    } catch (error) {
        console.info('[refreg] Skipping connect_wallet due to error:', error);
        return null;
    }
}

export async function buildTradeRefregInstructions(
    params: BuildIxParams,
): Promise<TransactionInstruction[]> {
    try {
        const trackingIdBytes = await getTrackingIdHash();
        if (!trackingIdBytes) {
            return [];
        }

        const instructions: TransactionInstruction[] = [];
        instructions.push(buildFirstTradeIx(params));

        const referralIdBytes = getReferralIdBytes();
        if (referralIdBytes) {
            instructions.push(
                buildCompleteConversionIxWithBytes(
                    params,
                    referralIdBytes,
                    trackingIdBytes,
                ),
            );
        }

        return instructions;
    } catch (error) {
        console.info(
            '[refreg] Skipping trade refreg instructions due to error:',
            error,
        );
        return [];
    }
}
