import {
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useNotificationStore } from '../stores/NotificationStore';
import { getTxLink } from './Constants';

type BuildIxParams = {
    sessionPublicKey: PublicKey;
    walletPublicKey: PublicKey;
};

export type ReferralKind = 0 | 1;

export interface ReferralAttribution {
    referralKind: ReferralKind;
    referralId: Uint8Array;
    sourceValue: string;
}

export interface ConnectWalletBuildResult {
    instruction: TransactionInstruction;
    fingerprint: string;
    referralAttribution: ReferralAttribution;
    trackingId: Uint8Array;
}

export interface TradeRefregBuildResult {
    instructions: TransactionInstruction[];
    includesFirstTrade: boolean;
    includesCompleteConversion: boolean;
    referralAttribution: ReferralAttribution | null;
    trackingId: Uint8Array | null;
}

export interface RefregTxPollResult {
    check: string;
    success: boolean;
}

const DEFAULT_REFREG_PROGRAM_ID = 'J1uNjRVhUCFdRt5K1fnmxGe5uHfqwHkvgWifzwaMN7m';
const DEFAULT_REFREG_DAPP_ID = 'ambi3LHRUzmU187u4rP46rX6wrYrLtU1Bmi5U2yCTGE';
const DEFAULT_REFREG_API_BASE_URL =
    'https://ember-refreg-testnet.liquidity.tools';

const REFREG_PROGRAM_ID = parseEnvPublicKey(
    import.meta.env.VITE_REFREG_PROGRAM_ID ??
        import.meta.env.REFREG_PROGRAM_ID ??
        '',
    DEFAULT_REFREG_PROGRAM_ID,
    'REFREG_PROGRAM_ID',
);
const REFREG_DAPP_ID = parseEnvPublicKey(
    import.meta.env.VITE_REFREG_DAPP_ID ?? import.meta.env.REFREG_DAPP_ID ?? '',
    DEFAULT_REFREG_DAPP_ID,
    'REFREG_DAPP_ID',
);
const REFREG_API_BASE_URL = normalizeBaseUrl(
    import.meta.env.VITE_REFREG_API_BASE_URL ??
        import.meta.env.REFREG_API_BASE_URL ??
        DEFAULT_REFREG_API_BASE_URL,
);

const REFERRAL_SEED_PREFIX = new TextEncoder().encode('referral');
const CONNECT_WALLET_SEED_PREFIX = new TextEncoder().encode('connect_wallet');
const FIRST_TRADE_SEED_PREFIX = new TextEncoder().encode('first_trade');

const REFERRAL_KIND_STORAGE_KEY = 'referral_kind';
const REFERRAL_ID_STORAGE_KEY = 'referral_id';
const REFERRAL_STORE_STORAGE_KEY = 'AFFILIATE_DATA';
const TRACKING_ID_STORAGE_KEY = 'fuul.tracking_id';

const COMPLETE_CONVERSION_TAG = 0;
const CONNECT_WALLET_TAG = 1;
const FIRST_TRADE_TAG = 2;

const REFREG_POLL_INTERVAL_MS = 1_000;
const REFREG_POLL_TIMEOUT_MS = 45_000;
const REFREG_REQUEST_TIMEOUT_MS = 5_000;

function parseEnvPublicKey(
    value: string,
    fallback: string,
    envName: string,
): PublicKey {
    try {
        if (value && value.trim().length > 0) {
            return new PublicKey(value.trim());
        }
        return new PublicKey(fallback);
    } catch {
        console.warn(
            `[refreg] Invalid ${envName} value. Falling back to ${fallback}`,
        );
        return new PublicKey(fallback);
    }
}

function normalizeBaseUrl(value: string): string {
    return value.trim().replace(/\/+$/, '');
}

function readLocalStorage(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage.getItem(key);
    } catch (error) {
        console.info('[refreg] localStorage access failed:', error);
        return null;
    }
}

function parseBase58PublicKeyBytes(value: string): Uint8Array | null {
    try {
        return new PublicKey(value).toBytes();
    } catch {
        return null;
    }
}

function parseHexId32(value: string): Uint8Array | null {
    const normalized = value.startsWith('0x') ? value.slice(2) : value;
    if (!/^[0-9a-fA-F]+$/.test(normalized) || normalized.length !== 64) {
        return null;
    }
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i += 1) {
        const hexPair = normalized.slice(i * 2, i * 2 + 2);
        bytes[i] = Number.parseInt(hexPair, 16);
    }
    return bytes;
}

function assertLen32(name: string, value: Uint8Array): void {
    if (value.length !== 32) {
        throw new Error(`${name} must be 32 bytes`);
    }
}

function parseTrackingIdToId32(value: string): Uint8Array | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    const fromHex = parseHexId32(trimmed);
    if (fromHex) {
        return fromHex;
    }

    const fromBase58 = parseBase58PublicKeyBytes(trimmed);
    if (fromBase58) {
        return fromBase58;
    }

    const utf8Bytes = new TextEncoder().encode(trimmed);
    if (utf8Bytes.length === 32) {
        return utf8Bytes;
    }

    return null;
}

export function paddedStringToId32(value: string): Uint8Array {
    const raw = new TextEncoder().encode(value);
    if (raw.length > 32) {
        throw new Error('padded string id must be <= 32 bytes');
    }
    const out = new Uint8Array(32);
    out.set(raw);
    return out;
}

function parseReferralKind(rawKind: string | null): ReferralKind | null {
    if (rawKind === '0') return 0;
    if (rawKind === '1') return 1;
    return null;
}

function readPersistedReferralCode(): string | null {
    const raw = readLocalStorage(REFERRAL_STORE_STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as {
            state?: { cached?: unknown };
        };
        const cached = parsed?.state?.cached;
        if (typeof cached !== 'string') {
            return null;
        }
        const trimmed = cached.trim();
        return trimmed.length > 0 ? trimmed : null;
    } catch {
        return null;
    }
}

function resolveReferralAttribution(): ReferralAttribution | null {
    const explicitKind = parseReferralKind(
        readLocalStorage(REFERRAL_KIND_STORAGE_KEY),
    );
    const explicitIdRaw =
        readLocalStorage(REFERRAL_ID_STORAGE_KEY)?.trim() || '';

    if (explicitIdRaw.length > 0 && explicitKind !== null) {
        if (explicitKind === 0) {
            const referralId = parseBase58PublicKeyBytes(explicitIdRaw);
            if (!referralId) {
                console.info(
                    '[refreg] referral_kind=0 requires a valid base58 pubkey referral_id',
                );
                return null;
            }
            return {
                referralKind: 0,
                referralId,
                sourceValue: explicitIdRaw,
            };
        }

        try {
            return {
                referralKind: 1,
                referralId: paddedStringToId32(explicitIdRaw),
                sourceValue: explicitIdRaw,
            };
        } catch {
            console.info('[refreg] Invalid referral_id for referral_kind=1');
            return null;
        }
    }

    if (explicitIdRaw.length > 0) {
        const asPubkey = parseBase58PublicKeyBytes(explicitIdRaw);
        if (asPubkey) {
            return {
                referralKind: 0,
                referralId: asPubkey,
                sourceValue: explicitIdRaw,
            };
        }

        try {
            return {
                referralKind: 1,
                referralId: paddedStringToId32(explicitIdRaw),
                sourceValue: explicitIdRaw,
            };
        } catch {
            console.info(
                '[refreg] Ignoring invalid explicit referral_id value',
            );
        }
    }

    const cachedReferralCode = readPersistedReferralCode();
    if (!cachedReferralCode) {
        return null;
    }

    try {
        return {
            referralKind: 1,
            referralId: paddedStringToId32(cachedReferralCode),
            sourceValue: cachedReferralCode,
        };
    } catch {
        console.info('[refreg] Cached referral code exceeds 32 UTF-8 bytes');
        return null;
    }
}

function getTrackingIdBytes(): Uint8Array | null {
    const trackingIdRaw = readLocalStorage(TRACKING_ID_STORAGE_KEY);
    if (!trackingIdRaw) {
        console.info('[refreg] tracking_id missing');
        return null;
    }

    const trackingId = parseTrackingIdToId32(trackingIdRaw);
    if (!trackingId) {
        console.info(
            '[refreg] tracking_id must be exactly 32 bytes (base58 pubkey, 64-char hex, or UTF-8 length 32)',
        );
        return null;
    }

    return trackingId;
}

function id32ToBase58(id32: Uint8Array): string {
    assertLen32('id32', id32);
    return new PublicKey(id32).toBase58();
}

function getDappIdBytes(): Uint8Array {
    return REFREG_DAPP_ID.toBytes();
}

function getDappIdBase58(): string {
    return REFREG_DAPP_ID.toBase58();
}

function getUserKey(walletPublicKey: PublicKey): string {
    return walletPublicKey.toBase58();
}

function buildApiUrl(path: string, params: Record<string, string>): string {
    const url = new URL(path, REFREG_API_BASE_URL);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
}

type RefregApiError = {
    error?: {
        code?: string;
        message?: string;
    };
};

function isApiErrorResponse(value: unknown): value is RefregApiError {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const record = value as Record<string, unknown>;
    return typeof record.error === 'object' && record.error !== null;
}

async function fetchRefregJson<T>(
    path: string,
    params: Record<string, string>,
    timeoutMs = REFREG_REQUEST_TIMEOUT_MS,
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(buildApiUrl(path, params), {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
            signal: controller.signal,
        });

        const json = (await response.json()) as T;

        if (!response.ok) {
            throw new Error(
                `[refreg] API ${path} failed: HTTP ${response.status}`,
            );
        }

        return json;
    } finally {
        clearTimeout(timeoutId);
    }
}

interface ConversionStatusResponse {
    converted?: boolean;
}

export async function fetchConversionStatus(params: {
    walletPublicKey: PublicKey;
}): Promise<boolean | null> {
    try {
        const response = await fetchRefregJson<
            ConversionStatusResponse | RefregApiError
        >('/v1/referrals/conversion-status', {
            dapp_id: getDappIdBase58(),
            user_pubkey: getUserKey(params.walletPublicKey),
        });

        if (isApiErrorResponse(response)) {
            return null;
        }

        return response.converted === true;
    } catch (error) {
        console.info('[refreg] conversion-status preflight failed:', error);
        return null;
    }
}

interface ReferralStatsResponse {
    pending_count: number;
    converted_count: number;
}

export async function fetchReferralStats(params: {
    referralKind: ReferralKind;
    referralId: Uint8Array;
}): Promise<ReferralStatsResponse | null> {
    try {
        const response = await fetchRefregJson<
            ReferralStatsResponse | RefregApiError
        >('/v1/referrals/stats', {
            dapp_id: getDappIdBase58(),
            referral_kind: String(params.referralKind),
            referral_id: id32ToBase58(params.referralId),
        });

        if (isApiErrorResponse(response)) {
            return null;
        }

        return response;
    } catch (error) {
        console.info('[refreg] referral-stats fetch failed:', error);
        return null;
    }
}

export function buildConnectWalletInstruction(args: {
    actor: PublicKey;
    walletPublicKey: PublicKey;
    dappId: Uint8Array;
    referralKind: ReferralKind;
    referralId: Uint8Array;
    trackingId: Uint8Array;
}): TransactionInstruction {
    assertLen32('dappId', args.dappId);
    assertLen32('referralId', args.referralId);
    assertLen32('trackingId', args.trackingId);

    const [record] = PublicKey.findProgramAddressSync(
        [
            CONNECT_WALLET_SEED_PREFIX,
            Buffer.from(args.dappId),
            Buffer.from(args.trackingId),
            args.walletPublicKey.toBuffer(),
        ],
        REFREG_PROGRAM_ID,
    );

    const data = new Uint8Array(98);
    data[0] = CONNECT_WALLET_TAG;
    data.set(args.dappId, 1);
    data[33] = args.referralKind;
    data.set(args.referralId, 34);
    data.set(args.trackingId, 66);

    return new TransactionInstruction({
        programId: REFREG_PROGRAM_ID,
        keys: [
            { pubkey: args.actor, isSigner: true, isWritable: true },
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

export function buildFirstTradeInstruction(args: {
    actor: PublicKey;
    walletPublicKey: PublicKey;
    dappId: Uint8Array;
}): TransactionInstruction {
    assertLen32('dappId', args.dappId);

    const [record] = PublicKey.findProgramAddressSync(
        [
            FIRST_TRADE_SEED_PREFIX,
            Buffer.from(args.dappId),
            args.walletPublicKey.toBuffer(),
        ],
        REFREG_PROGRAM_ID,
    );

    const data = new Uint8Array(33);
    data[0] = FIRST_TRADE_TAG;
    data.set(args.dappId, 1);

    return new TransactionInstruction({
        programId: REFREG_PROGRAM_ID,
        keys: [
            { pubkey: args.actor, isSigner: true, isWritable: true },
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

export function buildCompleteConversionInstruction(args: {
    actor: PublicKey;
    walletPublicKey: PublicKey;
    dappId: Uint8Array;
    referralKind: ReferralKind;
    referralId: Uint8Array;
    trackingId: Uint8Array;
}): TransactionInstruction {
    assertLen32('dappId', args.dappId);
    assertLen32('referralId', args.referralId);
    assertLen32('trackingId', args.trackingId);

    const [record] = PublicKey.findProgramAddressSync(
        [
            REFERRAL_SEED_PREFIX,
            Buffer.from(args.dappId),
            args.walletPublicKey.toBuffer(),
        ],
        REFREG_PROGRAM_ID,
    );

    const data = new Uint8Array(98);
    data[0] = COMPLETE_CONVERSION_TAG;
    data.set(args.dappId, 1);
    data[33] = args.referralKind;
    data.set(args.referralId, 34);
    data.set(args.trackingId, 66);

    return new TransactionInstruction({
        programId: REFREG_PROGRAM_ID,
        keys: [
            { pubkey: args.actor, isSigner: true, isWritable: true },
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
): Promise<ConnectWalletBuildResult | null> {
    try {
        const trackingId = getTrackingIdBytes();
        if (!trackingId) {
            return null;
        }

        const referralAttribution = resolveReferralAttribution();
        if (!referralAttribution) {
            return null;
        }

        const dappId = getDappIdBytes();
        const instruction = buildConnectWalletInstruction({
            actor: params.sessionPublicKey,
            walletPublicKey: params.walletPublicKey,
            dappId,
            referralKind: referralAttribution.referralKind,
            referralId: referralAttribution.referralId,
            trackingId,
        });

        const fingerprint = [
            params.walletPublicKey.toBase58(),
            id32ToBase58(trackingId),
            String(referralAttribution.referralKind),
            id32ToBase58(referralAttribution.referralId),
        ].join(':');

        return {
            instruction,
            fingerprint,
            referralAttribution,
            trackingId,
        };
    } catch (error) {
        console.info('[refreg] Skipping connect_wallet due to error:', error);
        return null;
    }
}

export async function buildTradeRefregInstructions(
    params: BuildIxParams,
): Promise<TradeRefregBuildResult> {
    try {
        const dappId = getDappIdBytes();
        const instructions: TransactionInstruction[] = [
            buildFirstTradeInstruction({
                actor: params.sessionPublicKey,
                walletPublicKey: params.walletPublicKey,
                dappId,
            }),
        ];

        const referralAttribution = resolveReferralAttribution();
        if (!referralAttribution) {
            return {
                instructions,
                includesFirstTrade: true,
                includesCompleteConversion: false,
                referralAttribution: null,
                trackingId: null,
            };
        }

        const trackingId = getTrackingIdBytes();
        if (!trackingId) {
            console.info(
                '[refreg] Skipping complete_conversion because tracking_id is unavailable',
            );
            return {
                instructions,
                includesFirstTrade: true,
                includesCompleteConversion: false,
                referralAttribution,
                trackingId: null,
            };
        }

        const isAlreadyConverted = await fetchConversionStatus({
            walletPublicKey: params.walletPublicKey,
        });
        if (isAlreadyConverted === true) {
            return {
                instructions,
                includesFirstTrade: true,
                includesCompleteConversion: false,
                referralAttribution,
                trackingId,
            };
        }

        instructions.push(
            buildCompleteConversionInstruction({
                actor: params.sessionPublicKey,
                walletPublicKey: params.walletPublicKey,
                dappId,
                referralKind: referralAttribution.referralKind,
                referralId: referralAttribution.referralId,
                trackingId,
            }),
        );

        return {
            instructions,
            includesFirstTrade: true,
            includesCompleteConversion: true,
            referralAttribution,
            trackingId,
        };
    } catch (error) {
        console.info(
            '[refreg] Skipping trade refreg instructions due to error:',
            error,
        );
        return {
            instructions: [],
            includesFirstTrade: false,
            includesCompleteConversion: false,
            referralAttribution: null,
            trackingId: null,
        };
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function pollUntil(
    label: string,
    txSignature: string,
    check: () => Promise<boolean>,
): Promise<boolean> {
    const start = Date.now();

    while (Date.now() - start < REFREG_POLL_TIMEOUT_MS) {
        try {
            const done = await check();
            if (done) {
                return true;
            }
        } catch (error) {
            console.info(`[refreg] ${label} poll attempt failed:`, error);
        }

        await delay(REFREG_POLL_INTERVAL_MS);
    }

    console.warn(
        `[refreg] Timed out waiting for ${label}. tx=${txSignature}. Please contact support with this transaction signature.`,
    );

    useNotificationStore.getState().add({
        title: 'Referral indexing delayed',
        message: `Referral state check timed out after 45s (${label}). Share tx ${txSignature} with support.`,
        icon: 'error',
        txLink: getTxLink(txSignature),
    });

    return false;
}

async function checkByUserEndpoint(path: string, walletPublicKey: PublicKey) {
    const response = await fetchRefregJson<Record<string, unknown>>(
        path,
        {
            dapp_id: getDappIdBase58(),
            user_pubkey: walletPublicKey.toBase58(),
        },
        REFREG_REQUEST_TIMEOUT_MS,
    );

    return !isApiErrorResponse(response);
}

export async function pollConnectWalletConsistency(args: {
    txSignature: string;
    walletPublicKey: PublicKey;
    referralAttribution: ReferralAttribution;
}): Promise<RefregTxPollResult[]> {
    const results: RefregTxPollResult[] = [];

    const connectWalletIndexed = await pollUntil(
        'connect-wallet indexing',
        args.txSignature,
        async () =>
            checkByUserEndpoint(
                '/v1/connect-wallet/by-user',
                args.walletPublicKey,
            ),
    );

    results.push({
        check: 'connect-wallet/by-user',
        success: connectWalletIndexed,
    });

    const stats = await fetchReferralStats({
        referralKind: args.referralAttribution.referralKind,
        referralId: args.referralAttribution.referralId,
    });

    if (stats) {
        console.info('[refreg] referral-stats after connect_wallet:', {
            pending_count: stats.pending_count,
            converted_count: stats.converted_count,
        });
    }

    return results;
}

export async function pollTradeConsistency(args: {
    txSignature: string;
    walletPublicKey: PublicKey;
    includesFirstTrade: boolean;
    includesCompleteConversion: boolean;
    referralAttribution: ReferralAttribution | null;
}): Promise<RefregTxPollResult[]> {
    const checks: Promise<RefregTxPollResult>[] = [];

    if (args.includesFirstTrade) {
        checks.push(
            pollUntil('first-trade indexing', args.txSignature, async () =>
                checkByUserEndpoint(
                    '/v1/first-trade/by-user',
                    args.walletPublicKey,
                ),
            ).then((success) => ({
                check: 'first-trade/by-user',
                success,
            })),
        );
    }

    if (args.includesCompleteConversion) {
        checks.push(
            pollUntil(
                'conversion-status indexing',
                args.txSignature,
                async () => {
                    const converted = await fetchConversionStatus({
                        walletPublicKey: args.walletPublicKey,
                    });
                    return converted === true;
                },
            ).then((success) => ({
                check: 'referrals/conversion-status',
                success,
            })),
        );

        checks.push(
            pollUntil(
                'conversion record indexing',
                args.txSignature,
                async () =>
                    checkByUserEndpoint(
                        '/v1/referrals/by-user',
                        args.walletPublicKey,
                    ),
            ).then((success) => ({
                check: 'referrals/by-user',
                success,
            })),
        );
    }

    const results = await Promise.all(checks);

    if (args.includesCompleteConversion && args.referralAttribution) {
        const stats = await fetchReferralStats({
            referralKind: args.referralAttribution.referralKind,
            referralId: args.referralAttribution.referralId,
        });

        if (stats) {
            console.info('[refreg] referral-stats after conversion:', {
                pending_count: stats.pending_count,
                converted_count: stats.converted_count,
            });
        }
    }

    return results;
}
