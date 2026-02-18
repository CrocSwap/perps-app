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
    payerPublicKey: PublicKey;
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

const REFERRAL_STORE_STORAGE_KEY = 'AFFILIATE_DATA';
const TRACKING_ID_STORAGE_KEY = 'fuul.tracking_id';

const COMPLETE_CONVERSION_TAG = 0;
const CONNECT_WALLET_TAG = 1;
const FIRST_TRADE_TAG = 2;

const REFREG_REQUEST_TIMEOUT_MS = 5_000;
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
    for (let idx = 0; idx < value.length; idx += 1) {
        if (value.charCodeAt(idx) > 0x7f) {
            throw new Error('padded string id must be ASCII');
        }
    }

    const raw = new TextEncoder().encode(value);
    if (raw.length > 32) {
        throw new Error('padded string id must be <= 32 bytes');
    }
    const out = new Uint8Array(32);
    // Left-pad short ids with 0x00 bytes to satisfy [u8; 32].
    out.set(raw, 32 - raw.length);
    return out;
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

function deriveReferralAttributionFromId(
    rawReferralId: string,
    sourceValue: string,
): ReferralAttribution | null {
    const trimmed = rawReferralId.trim();
    if (!trimmed) {
        return null;
    }

    const fromBase58 = parseBase58PublicKeyBytes(trimmed);
    if (fromBase58) {
        return {
            referralKind: 0,
            referralId: fromBase58,
            sourceValue,
        };
    }

    try {
        return {
            referralKind: 1,
            referralId: paddedStringToId32(trimmed),
            sourceValue,
        };
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
    const cachedReferralCode = readPersistedReferralCode();
    if (!cachedReferralCode) {
        console.info(
            '[refreg] referral attribution unavailable: no cached referral code',
        );
        return null;
    }

    const referralAttribution = deriveReferralAttributionFromId(
        cachedReferralCode,
        cachedReferralCode,
    );
    if (referralAttribution) {
        console.log(
            '[refreg] resolved referral attribution from cached referral code',
            {
                sourceValue: cachedReferralCode,
                referralKind: referralAttribution.referralKind,
            },
        );
        return referralAttribution;
    }

    console.info(
        '[refreg] Cached referral code must be base58 pubkey or ASCII <= 32 bytes',
    );
    return null;
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
        const referralKindFromRecord = parseReferralKindValue(rawReferralKind);

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
                },
            );
            return null;
        }

        const trimmedReferralId = rawReferralId.trim();
        const referralAttribution = deriveReferralAttributionFromId(
            trimmedReferralId,
            `connect-wallet/by-user:${trimmedReferralId}`,
        );
        if (!referralAttribution) {
            console.info(
                '[refreg] connect-wallet/by-user referral_id could not be parsed',
                {
                    walletPublicKey: params.walletPublicKey.toBase58(),
                    rawReferralId,
                },
            );
            return null;
        }

        if (
            referralKindFromRecord !== null &&
            referralKindFromRecord !== referralAttribution.referralKind
        ) {
            console.info(
                '[refreg] connect-wallet/by-user referral_kind does not match derived kind; using derived kind from referral_id',
                {
                    walletPublicKey: params.walletPublicKey.toBase58(),
                    referralKindFromRecord,
                    referralKindDerived: referralAttribution.referralKind,
                    rawReferralId: trimmedReferralId,
                },
            );
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

        console.info('[refreg] connect-wallet/by-user attribution resolved', {
            walletPublicKey: params.walletPublicKey.toBase58(),
            referralKind: referralAttribution.referralKind,
            referralId: id32ToBase58(referralAttribution.referralId),
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
    payer: PublicKey;
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
            { pubkey: args.payer, isSigner: true, isWritable: true },
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
    payer: PublicKey;
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
            { pubkey: args.payer, isSigner: true, isWritable: true },
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
    payer: PublicKey;
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
            { pubkey: args.payer, isSigner: true, isWritable: true },
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
            payerPublicKey: params.payerPublicKey.toBase58(),
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
            payer: params.payerPublicKey,
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
            payerPublicKey: params.payerPublicKey.toBase58(),
        });
        const dappId = getDappIdBytes();
        const instructions: TransactionInstruction[] = [
            buildFirstTradeInstruction({
                actor: params.sessionPublicKey,
                payer: params.payerPublicKey,
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
                payer: params.payerPublicKey,
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

function readInstructionTag(
    instruction: TransactionInstruction,
): number | null {
    if (instruction.data.length === 0) {
        return null;
    }

    return instruction.data[0];
}

function getInstructionLabel(instruction: TransactionInstruction): string {
    const tag = readInstructionTag(instruction);
    if (tag === COMPLETE_CONVERSION_TAG) {
        return 'complete_conversion';
    }

    if (tag === CONNECT_WALLET_TAG) {
        return 'connect_wallet';
    }

    if (tag === FIRST_TRADE_TAG) {
        return 'first_trade';
    }

    return 'unknown';
}

function extractTransactionSignature(
    transactionResult: unknown,
): string | null {
    if (!transactionResult || typeof transactionResult !== 'object') {
        return null;
    }

    const signature = (transactionResult as { signature?: unknown }).signature;
    if (typeof signature === 'string' && signature.length > 0) {
        return signature;
    }

    return null;
}

function transactionHasError(transactionResult: unknown): boolean {
    if (!transactionResult || typeof transactionResult !== 'object') {
        return false;
    }

    return 'error' in transactionResult;
}

export async function sendStandaloneRefregTransactions(args: {
    context: string;
    walletPublicKey: PublicKey;
    instructions: TransactionInstruction[];
    sendTransaction: (
        instructions: TransactionInstruction[],
    ) => Promise<unknown>;
    parentTransactionSignature?: string;
}): Promise<void> {
    logRefregConfigOnce();

    if (args.instructions.length === 0) {
        console.info('[refreg] no standalone refreg instructions to send', {
            context: args.context,
            walletPublicKey: args.walletPublicKey.toBase58(),
            parentTransactionSignature: args.parentTransactionSignature ?? null,
        });
        return;
    }

    console.info('[refreg] sending standalone refreg transactions', {
        context: args.context,
        walletPublicKey: args.walletPublicKey.toBase58(),
        instructionCount: args.instructions.length,
        parentTransactionSignature: args.parentTransactionSignature ?? null,
    });

    for (const [instructionIndex, instruction] of args.instructions.entries()) {
        const label = getInstructionLabel(instruction);
        const tag = readInstructionTag(instruction);
        console.info('[refreg] sending standalone refreg tx', {
            context: args.context,
            walletPublicKey: args.walletPublicKey.toBase58(),
            instructionIndex,
            label,
            tag,
            parentTransactionSignature: args.parentTransactionSignature ?? null,
        });

        try {
            const transactionResult = await args.sendTransaction([instruction]);
            const signature = extractTransactionSignature(transactionResult);
            const hasError = transactionHasError(transactionResult);

            if (signature && !hasError) {
                console.info('[refreg] standalone refreg tx sent', {
                    context: args.context,
                    walletPublicKey: args.walletPublicKey.toBase58(),
                    instructionIndex,
                    label,
                    tag,
                    signature,
                    parentTransactionSignature:
                        args.parentTransactionSignature ?? null,
                });
            } else {
                console.info(
                    '[refreg] standalone refreg tx returned without successful signature',
                    {
                        context: args.context,
                        walletPublicKey: args.walletPublicKey.toBase58(),
                        instructionIndex,
                        label,
                        tag,
                        transactionResult,
                        parentTransactionSignature:
                            args.parentTransactionSignature ?? null,
                    },
                );
            }
        } catch (error) {
            console.info('[refreg] standalone refreg tx failed', {
                context: args.context,
                walletPublicKey: args.walletPublicKey.toBase58(),
                instructionIndex,
                label,
                tag,
                parentTransactionSignature:
                    args.parentTransactionSignature ?? null,
                error,
            });
        }
    }
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
