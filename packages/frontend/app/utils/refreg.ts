import {
    PublicKey,
    SystemProgram,
    SYSVAR_CLOCK_PUBKEY,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
} from '@solana/web3.js';
import { Buffer } from 'buffer';

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
const CONVERSION_DETECTED_STORAGE_PREFIX = 'refreg.conversion_detected';

const COMPLETE_CONVERSION_TAG = 0;
const CONNECT_WALLET_TAG = 1;
const FIRST_TRADE_TAG = 2;

const REFREG_POLL_INTERVAL_MS = 30_000;
const REFREG_REQUEST_TIMEOUT_MS = 5_000;
const activeConversionStatusPolls = new Set<string>();
let hasLoggedRefregConfig = false;

function logRefregConfigOnce(): void {
    if (hasLoggedRefregConfig) {
        return;
    }

    hasLoggedRefregConfig = true;
    console.log('[refreg] runtime config', {
        programId: REFREG_PROGRAM_ID.toBase58(),
        dappId: REFREG_DAPP_ID.toBase58(),
        apiBaseUrl: REFREG_API_BASE_URL,
        pollIntervalMs: REFREG_POLL_INTERVAL_MS,
        requestTimeoutMs: REFREG_REQUEST_TIMEOUT_MS,
    });
}

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

function writeLocalStorage(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(key, value);
    } catch (error) {
        console.info('[refreg] localStorage write failed:', error);
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
    if (utf8Bytes.length > 0 && utf8Bytes.length <= 32) {
        const out = new Uint8Array(32);
        // Left-pad short tracking ids with 0x00 bytes to satisfy [u8; 32].
        out.set(utf8Bytes, 32 - utf8Bytes.length);
        return out;
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

function parseReferralKindValue(rawKind: unknown): ReferralKind | null {
    if (rawKind === 0 || rawKind === '0') return 0;
    if (rawKind === 1 || rawKind === '1') return 1;
    return null;
}

function readRecordField(
    record: Record<string, unknown>,
    snakeCaseKey: string,
    camelCaseKey: string,
): unknown {
    if (snakeCaseKey in record) {
        return record[snakeCaseKey];
    }
    if (camelCaseKey in record) {
        return record[camelCaseKey];
    }
    return undefined;
}

function parseReferralIdFromConnectWalletRecord(
    referralKind: ReferralKind,
    rawReferralId: string,
): Uint8Array | null {
    const trimmed = rawReferralId.trim();
    if (!trimmed) {
        return null;
    }

    const fromHex = parseHexId32(trimmed);
    const fromBase58 = parseBase58PublicKeyBytes(trimmed);

    if (referralKind === 0) {
        return fromBase58 ?? fromHex;
    }

    if (fromHex || fromBase58) {
        return fromHex ?? fromBase58;
    }

    try {
        return paddedStringToId32(trimmed);
    } catch {
        return null;
    }
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
            console.log(
                '[refreg] resolved referral attribution from explicit storage (kind=1)',
                {
                    sourceValue: explicitIdRaw,
                },
            );
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
            console.log(
                '[refreg] resolved referral attribution from explicit storage (auto kind=0 pubkey)',
                {
                    sourceValue: explicitIdRaw,
                },
            );
            return {
                referralKind: 0,
                referralId: asPubkey,
                sourceValue: explicitIdRaw,
            };
        }

        try {
            console.log(
                '[refreg] resolved referral attribution from explicit storage (auto kind=1 string)',
                {
                    sourceValue: explicitIdRaw,
                },
            );
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
        console.info(
            '[refreg] referral attribution unavailable: no explicit referral id and no cached referral code',
        );
        return null;
    }

    try {
        console.log(
            '[refreg] resolved referral attribution from cached referral code',
            {
                sourceValue: cachedReferralCode,
            },
        );
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
            '[refreg] tracking_id must resolve to 32 bytes (base58 pubkey, 64-char hex, or UTF-8 <= 32 bytes left-padded with 0x00)',
        );
        return null;
    }

    console.log('[refreg] tracking_id resolved to id32', {
        value: trackingIdRaw,
        base58Id32: id32ToBase58(trackingId),
    });

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

function getConversionDetectedStorageKey(walletPublicKey: PublicKey): string {
    return `${CONVERSION_DETECTED_STORAGE_PREFIX}:${getDappIdBase58()}:${walletPublicKey.toBase58()}`;
}

function isConversionDetectedLocally(walletPublicKey: PublicKey): boolean {
    return (
        readLocalStorage(getConversionDetectedStorageKey(walletPublicKey)) ===
        '1'
    );
}

function markConversionDetectedLocally(walletPublicKey: PublicKey): void {
    writeLocalStorage(getConversionDetectedStorageKey(walletPublicKey), '1');
}

function getConversionPollKey(walletPublicKey: PublicKey): string {
    return `${getDappIdBase58()}:${walletPublicKey.toBase58()}`;
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
    const url = buildApiUrl(path, params);
    console.log('[refreg] API request', {
        path,
        url,
        timeoutMs,
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
            },
            signal: controller.signal,
        });

        const json = (await response.json()) as T;
        console.log('[refreg] API response', {
            path,
            status: response.status,
            ok: response.ok,
        });

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
        logRefregConfigOnce();
        const response = await fetchRefregJson<
            ConversionStatusResponse | RefregApiError
        >('/v1/referrals/conversion-status', {
            dapp_id: getDappIdBase58(),
            user_pubkey: getUserKey(params.walletPublicKey),
        });

        if (isApiErrorResponse(response)) {
            console.log(
                '[refreg] conversion-status returned API error payload',
                response,
            );
            return null;
        }

        const converted = response.converted === true;
        console.info('[refreg] conversion-status response', {
            walletPublicKey: params.walletPublicKey.toBase58(),
            converted,
        });
        if (converted) {
            markConversionDetectedLocally(params.walletPublicKey);
            console.info('[refreg] conversion latch marked in localStorage', {
                walletPublicKey: params.walletPublicKey.toBase58(),
            });
        }
        return converted;
    } catch (error) {
        console.info('[refreg] conversion-status preflight failed:', error);
        return null;
    }
}

interface ReferralStatsResponse {
    pending_count: number;
    converted_count: number;
}

interface ConnectWalletByUserRecord {
    referral_kind?: unknown;
    referralKind?: unknown;
    referral_id?: unknown;
    referralId?: unknown;
    tracking_id?: unknown;
    trackingId?: unknown;
}

interface ConnectWalletByUserResponse {
    record?: ConnectWalletByUserRecord | null;
    referral_kind?: unknown;
    referralKind?: unknown;
    referral_id?: unknown;
    referralId?: unknown;
    tracking_id?: unknown;
    trackingId?: unknown;
}

interface ConnectWalletAttributionContext {
    referralAttribution: ReferralAttribution;
    trackingId: Uint8Array;
}

export async function fetchReferralStats(params: {
    referralKind: ReferralKind;
    referralId: Uint8Array;
}): Promise<ReferralStatsResponse | null> {
    try {
        logRefregConfigOnce();
        const response = await fetchRefregJson<
            ReferralStatsResponse | RefregApiError
        >('/v1/referrals/stats', {
            dapp_id: getDappIdBase58(),
            referral_kind: String(params.referralKind),
            referral_id: id32ToBase58(params.referralId),
        });

        if (isApiErrorResponse(response)) {
            console.log('[refreg] referral-stats returned API error payload', {
                referralKind: params.referralKind,
                referralId: id32ToBase58(params.referralId),
                response,
            });
            return null;
        }

        console.info('[refreg] referral-stats response', {
            referralKind: params.referralKind,
            referralId: id32ToBase58(params.referralId),
            pending_count: response.pending_count,
            converted_count: response.converted_count,
        });
        return response;
    } catch (error) {
        console.info('[refreg] referral-stats fetch failed:', error);
        return null;
    }
}

async function fetchConnectWalletAttributionByUser(params: {
    walletPublicKey: PublicKey;
}): Promise<ConnectWalletAttributionContext | null> {
    try {
        const response = await fetchRefregJson<
            ConnectWalletByUserResponse | RefregApiError
        >('/v1/connect-wallet/by-user', {
            dapp_id: getDappIdBase58(),
            user_pubkey: getUserKey(params.walletPublicKey),
        });

        if (isApiErrorResponse(response)) {
            console.log(
                '[refreg] connect-wallet/by-user returned API error payload',
                response,
            );
            return null;
        }

        const root = response as Record<string, unknown>;
        const record =
            response.record && typeof response.record === 'object'
                ? (response.record as Record<string, unknown>)
                : root;

        const rawReferralKind = readRecordField(
            record,
            'referral_kind',
            'referralKind',
        );
        const referralKind = parseReferralKindValue(rawReferralKind);
        if (referralKind === null) {
            console.info(
                '[refreg] connect-wallet/by-user missing referral_kind in record',
                {
                    walletPublicKey: params.walletPublicKey.toBase58(),
                },
            );
            return null;
        }

        const rawReferralId = readRecordField(
            record,
            'referral_id',
            'referralId',
        );
        if (
            typeof rawReferralId !== 'string' ||
            rawReferralId.trim().length === 0
        ) {
            console.info(
                '[refreg] connect-wallet/by-user missing referral_id in record',
                {
                    walletPublicKey: params.walletPublicKey.toBase58(),
                    referralKind,
                },
            );
            return null;
        }

        const referralId = parseReferralIdFromConnectWalletRecord(
            referralKind,
            rawReferralId,
        );
        if (!referralId) {
            console.info(
                '[refreg] connect-wallet/by-user referral_id could not be parsed',
                {
                    walletPublicKey: params.walletPublicKey.toBase58(),
                    referralKind,
                    rawReferralId,
                },
            );
            return null;
        }

        const rawTrackingId = readRecordField(
            record,
            'tracking_id',
            'trackingId',
        );
        if (
            typeof rawTrackingId !== 'string' ||
            rawTrackingId.trim().length === 0
        ) {
            console.info(
                '[refreg] connect-wallet/by-user missing tracking_id in record',
                {
                    walletPublicKey: params.walletPublicKey.toBase58(),
                    referralKind,
                    rawReferralId,
                },
            );
            return null;
        }

        const trackingId = parseTrackingIdToId32(rawTrackingId);
        if (!trackingId) {
            console.info(
                '[refreg] connect-wallet/by-user tracking_id could not be parsed',
                {
                    walletPublicKey: params.walletPublicKey.toBase58(),
                    rawTrackingId,
                },
            );
            return null;
        }

        const referralAttribution: ReferralAttribution = {
            referralKind,
            referralId,
            sourceValue: `connect-wallet/by-user:${rawReferralId.trim()}`,
        };

        console.info('[refreg] connect-wallet/by-user attribution resolved', {
            walletPublicKey: params.walletPublicKey.toBase58(),
            referralKind,
            referralId: id32ToBase58(referralId),
            trackingId: id32ToBase58(trackingId),
        });

        return {
            referralAttribution,
            trackingId,
        };
    } catch (error) {
        console.info(
            '[refreg] connect-wallet/by-user attribution fetch failed:',
            error,
        );
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
        logRefregConfigOnce();
        console.info('[refreg] buildConnectWalletIx start', {
            walletPublicKey: params.walletPublicKey.toBase58(),
            sessionPublicKey: params.sessionPublicKey.toBase58(),
        });
        const trackingId = getTrackingIdBytes();
        if (!trackingId) {
            console.info(
                '[refreg] buildConnectWalletIx skipped: tracking_id not available/invalid',
            );
            return null;
        }

        const referralAttribution = resolveReferralAttribution();
        if (!referralAttribution) {
            console.info(
                '[refreg] buildConnectWalletIx skipped: referral attribution unavailable',
            );
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

        console.log('[refreg] buildConnectWalletIx success', {
            walletPublicKey: params.walletPublicKey.toBase58(),
            fingerprint,
            referralKind: referralAttribution.referralKind,
            referralSourceValue: referralAttribution.sourceValue,
            trackingId: id32ToBase58(trackingId),
        });

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
        logRefregConfigOnce();
        console.info('[refreg] buildTradeRefregInstructions start', {
            walletPublicKey: params.walletPublicKey.toBase58(),
            sessionPublicKey: params.sessionPublicKey.toBase58(),
        });
        if (isConversionDetectedLocally(params.walletPublicKey)) {
            console.info(
                '[refreg] conversion latch found locally; skipping trade refreg instruction build',
            );
            const result: TradeRefregBuildResult = {
                instructions: [],
                includesFirstTrade: false,
                includesCompleteConversion: false,
                referralAttribution: null,
                trackingId: null,
            };
            console.log('[refreg] trade refreg result (local latch)', {
                walletPublicKey: params.walletPublicKey.toBase58(),
                instructionCount: result.instructions.length,
                includesFirstTrade: result.includesFirstTrade,
                includesCompleteConversion: result.includesCompleteConversion,
            });
            return result;
        }

        const isAlreadyConverted = await fetchConversionStatus({
            walletPublicKey: params.walletPublicKey,
        });
        if (isAlreadyConverted === true) {
            console.info(
                '[refreg] conversion already detected via API; skipping trade refreg instruction build',
            );
            const result: TradeRefregBuildResult = {
                instructions: [],
                includesFirstTrade: false,
                includesCompleteConversion: false,
                referralAttribution: null,
                trackingId: null,
            };
            console.log('[refreg] trade refreg result (already converted)', {
                walletPublicKey: params.walletPublicKey.toBase58(),
                instructionCount: result.instructions.length,
                includesFirstTrade: result.includesFirstTrade,
                includesCompleteConversion: result.includesCompleteConversion,
            });
            return result;
        }

        const dappId = getDappIdBytes();
        const instructions: TransactionInstruction[] = [
            buildFirstTradeInstruction({
                actor: params.sessionPublicKey,
                walletPublicKey: params.walletPublicKey,
                dappId,
            }),
        ];

        let referralAttribution = resolveReferralAttribution();
        let trackingId = getTrackingIdBytes();

        if (!referralAttribution || !trackingId) {
            console.info(
                '[refreg] trade attribution incomplete in local storage; attempting connect-wallet/by-user fallback',
                {
                    walletPublicKey: params.walletPublicKey.toBase58(),
                    hasLocalReferralAttribution: Boolean(referralAttribution),
                    hasLocalTrackingId: Boolean(trackingId),
                },
            );
            const connectWalletFallback =
                await fetchConnectWalletAttributionByUser({
                    walletPublicKey: params.walletPublicKey,
                });

            if (connectWalletFallback) {
                if (!referralAttribution) {
                    referralAttribution =
                        connectWalletFallback.referralAttribution;
                }
                if (!trackingId) {
                    trackingId = connectWalletFallback.trackingId;
                }

                console.info(
                    '[refreg] trade attribution hydrated from connect-wallet/by-user',
                    {
                        walletPublicKey: params.walletPublicKey.toBase58(),
                        hasReferralAttribution: Boolean(referralAttribution),
                        hasTrackingId: Boolean(trackingId),
                    },
                );
            }
        }

        if (!referralAttribution) {
            console.info(
                '[refreg] no referral attribution (after fallback); returning first_trade only',
            );
            const result: TradeRefregBuildResult = {
                instructions,
                includesFirstTrade: true,
                includesCompleteConversion: false,
                referralAttribution: null,
                trackingId: null,
            };
            console.log('[refreg] trade refreg result (first_trade only)', {
                walletPublicKey: params.walletPublicKey.toBase58(),
                instructionCount: result.instructions.length,
                includesFirstTrade: result.includesFirstTrade,
                includesCompleteConversion: result.includesCompleteConversion,
            });
            return result;
        }

        if (!trackingId) {
            console.info(
                '[refreg] Skipping complete_conversion because tracking_id is unavailable (after fallback)',
            );
            const result: TradeRefregBuildResult = {
                instructions,
                includesFirstTrade: true,
                includesCompleteConversion: false,
                referralAttribution,
                trackingId: null,
            };
            console.log('[refreg] trade refreg result (no tracking_id)', {
                walletPublicKey: params.walletPublicKey.toBase58(),
                instructionCount: result.instructions.length,
                includesFirstTrade: result.includesFirstTrade,
                includesCompleteConversion: result.includesCompleteConversion,
                referralKind: referralAttribution.referralKind,
                referralSourceValue: referralAttribution.sourceValue,
            });
            return result;
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

        const result: TradeRefregBuildResult = {
            instructions,
            includesFirstTrade: true,
            includesCompleteConversion: true,
            referralAttribution,
            trackingId,
        };
        console.log('[refreg] trade refreg result (first_trade + conversion)', {
            walletPublicKey: params.walletPublicKey.toBase58(),
            instructionCount: result.instructions.length,
            includesFirstTrade: result.includesFirstTrade,
            includesCompleteConversion: result.includesCompleteConversion,
            referralKind: referralAttribution.referralKind,
            referralSourceValue: referralAttribution.sourceValue,
            trackingId: id32ToBase58(trackingId),
        });
        return result;
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
    check: () => Promise<boolean>,
): Promise<boolean> {
    let attempt = 0;
    while (true) {
        attempt += 1;
        console.log(`[refreg] ${label} poll attempt`, {
            attempt,
        });
        try {
            const done = await check();
            if (done) {
                console.log(`[refreg] ${label} poll resolved`, {
                    attempt,
                });
                return true;
            }
        } catch (error) {
            console.info(`[refreg] ${label} poll attempt failed:`, error);
        }

        console.log(`[refreg] ${label} poll pending`, {
            attempt,
            nextDelayMs: REFREG_POLL_INTERVAL_MS,
        });
        await delay(REFREG_POLL_INTERVAL_MS);
    }
}

function startBackgroundConversionStatusPolling(
    walletPublicKey: PublicKey,
): void {
    if (isConversionDetectedLocally(walletPublicKey)) {
        console.info(
            '[refreg] conversion poller not started: local conversion latch already set',
            { walletPublicKey: walletPublicKey.toBase58() },
        );
        return;
    }

    const pollKey = getConversionPollKey(walletPublicKey);
    if (activeConversionStatusPolls.has(pollKey)) {
        console.info(
            '[refreg] conversion poller already active for wallet, skipping duplicate',
            { pollKey },
        );
        return;
    }

    activeConversionStatusPolls.add(pollKey);
    console.info('[refreg] starting background conversion poller', {
        pollKey,
        walletPublicKey: walletPublicKey.toBase58(),
        intervalMs: REFREG_POLL_INTERVAL_MS,
        activePollers: activeConversionStatusPolls.size,
    });

    void pollUntil('conversion-status indexing', async () => {
        if (isConversionDetectedLocally(walletPublicKey)) {
            return true;
        }

        const converted = await fetchConversionStatus({ walletPublicKey });
        return converted === true;
    }).finally(() => {
        activeConversionStatusPolls.delete(pollKey);
        console.info('[refreg] background conversion poller finished', {
            pollKey,
            walletPublicKey: walletPublicKey.toBase58(),
            activePollers: activeConversionStatusPolls.size,
        });
    });
}

async function checkByUserEndpoint(path: string, walletPublicKey: PublicKey) {
    console.log('[refreg] one-shot by-user check request', {
        path,
        walletPublicKey: walletPublicKey.toBase58(),
    });
    const response = await fetchRefregJson<Record<string, unknown>>(
        path,
        {
            dapp_id: getDappIdBase58(),
            user_pubkey: walletPublicKey.toBase58(),
        },
        REFREG_REQUEST_TIMEOUT_MS,
    );

    const success = !isApiErrorResponse(response);
    console.log('[refreg] one-shot by-user check response', {
        path,
        walletPublicKey: walletPublicKey.toBase58(),
        success,
    });
    return success;
}

async function checkByUserEndpointOnce(
    path: string,
    walletPublicKey: PublicKey,
): Promise<boolean> {
    try {
        return await checkByUserEndpoint(path, walletPublicKey);
    } catch (error) {
        console.info(`[refreg] ${path} one-shot check failed:`, error);
        return false;
    }
}

export async function pollConnectWalletConsistency(args: {
    walletPublicKey: PublicKey;
    referralAttribution: ReferralAttribution;
}): Promise<RefregTxPollResult[]> {
    logRefregConfigOnce();
    console.info('[refreg] pollConnectWalletConsistency start', {
        walletPublicKey: args.walletPublicKey.toBase58(),
        referralKind: args.referralAttribution.referralKind,
        referralSourceValue: args.referralAttribution.sourceValue,
    });
    if (isConversionDetectedLocally(args.walletPublicKey)) {
        console.info(
            '[refreg] pollConnectWalletConsistency short-circuited: conversion already latched',
        );
        return [];
    }

    startBackgroundConversionStatusPolling(args.walletPublicKey);

    const results: RefregTxPollResult[] = [];

    const connectWalletIndexed = await checkByUserEndpointOnce(
        '/v1/connect-wallet/by-user',
        args.walletPublicKey,
    );
    console.info('[refreg] connect-wallet/by-user one-shot result', {
        walletPublicKey: args.walletPublicKey.toBase58(),
        success: connectWalletIndexed,
    });

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

    console.log('[refreg] pollConnectWalletConsistency completed', {
        walletPublicKey: args.walletPublicKey.toBase58(),
        checks: results,
    });

    return results;
}

export async function pollTradeConsistency(args: {
    walletPublicKey: PublicKey;
    includesFirstTrade: boolean;
    includesCompleteConversion: boolean;
    referralAttribution: ReferralAttribution | null;
}): Promise<RefregTxPollResult[]> {
    logRefregConfigOnce();
    console.info('[refreg] pollTradeConsistency start', {
        walletPublicKey: args.walletPublicKey.toBase58(),
        includesFirstTrade: args.includesFirstTrade,
        includesCompleteConversion: args.includesCompleteConversion,
        hasReferralAttribution: Boolean(args.referralAttribution),
    });
    if (isConversionDetectedLocally(args.walletPublicKey)) {
        console.info(
            '[refreg] pollTradeConsistency short-circuited: conversion already latched',
        );
        return [];
    }

    if (args.referralAttribution) {
        startBackgroundConversionStatusPolling(args.walletPublicKey);
    }

    const checks: Promise<RefregTxPollResult>[] = [];

    if (args.includesFirstTrade) {
        checks.push(
            checkByUserEndpointOnce(
                '/v1/first-trade/by-user',
                args.walletPublicKey,
            ).then((success) => ({
                check: 'first-trade/by-user',
                success,
            })),
        );
    }

    if (args.includesCompleteConversion) {
        checks.push(
            checkByUserEndpointOnce(
                '/v1/referrals/by-user',
                args.walletPublicKey,
            ).then((success) => ({
                check: 'referrals/by-user',
                success,
            })),
        );
    }

    if (checks.length === 0) {
        console.log('[refreg] pollTradeConsistency no one-shot checks queued', {
            walletPublicKey: args.walletPublicKey.toBase58(),
            includesFirstTrade: args.includesFirstTrade,
            includesCompleteConversion: args.includesCompleteConversion,
        });
    }

    const results = await Promise.all(checks);
    console.log('[refreg] pollTradeConsistency one-shot results', {
        walletPublicKey: args.walletPublicKey.toBase58(),
        checks: results,
    });

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

    console.log('[refreg] pollTradeConsistency completed', {
        walletPublicKey: args.walletPublicKey.toBase58(),
        checks: results,
    });

    return results;
}
