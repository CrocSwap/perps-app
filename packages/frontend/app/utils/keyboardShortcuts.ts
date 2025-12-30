export type ShortcutKeyToken = string;

export interface KeyboardShortcutItem {
    id: string;
    keys: ShortcutKeyToken[];
    description: string;
}

export interface KeyboardShortcutCategory {
    title: string;
    shortcuts: KeyboardShortcutItem[];
}

type TOptions = {
    returnObjects?: boolean;
    defaultValue?: string;
} & Record<string, unknown>;

export type TFunctionLike = (key: string, options?: TOptions) => unknown;

const CUSTOM_SHORTCUTS_STORAGE_KEY = 'customKeyboardShortcuts';

interface DefaultShortcut {
    id: string;
    keys: ShortcutKeyToken[];
    descriptionKey: string;
}

interface DefaultCategory {
    titleKey: string;
    shortcuts: DefaultShortcut[];
}

const DEFAULT_SHORTCUT_CATEGORIES: DefaultCategory[] = [
    {
        titleKey: 'keyboardShortcuts.categoryTitles.general',
        shortcuts: [
            {
                id: 'shortcuts.open',
                keys: ['shift', '?'],
                descriptionKey: 'keyboardShortcuts.descriptions.shortcuts.open',
            },
            {
                id: 'settings.open',
                keys: ['mod', ','],
                descriptionKey: 'keyboardShortcuts.descriptions.settings.open',
            },
            {
                id: 'modal.close',
                keys: ['esc'],
                descriptionKey: 'keyboardShortcuts.descriptions.modal.close',
            },
        ],
    },
    {
        titleKey: 'keyboardShortcuts.categoryTitles.trading',
        shortcuts: [
            {
                id: 'trading.buy',
                keys: ['b'],
                descriptionKey: 'keyboardShortcuts.descriptions.trading.buy',
            },
            {
                id: 'trading.sell',
                keys: ['s'],
                descriptionKey: 'keyboardShortcuts.descriptions.trading.sell',
            },
            {
                id: 'trading.market',
                keys: ['m'],
                descriptionKey: 'keyboardShortcuts.descriptions.trading.market',
            },
            {
                id: 'trading.limit',
                keys: ['l'],
                descriptionKey: 'keyboardShortcuts.descriptions.trading.limit',
            },
            {
                id: 'trading.marketClose',
                keys: ['alt', 'm'],
                descriptionKey:
                    'keyboardShortcuts.descriptions.trading.marketClose',
            },
        ],
    },
    {
        titleKey: 'keyboardShortcuts.categoryTitles.navigation',
        shortcuts: [
            {
                id: 'navigation.trade',
                keys: ['t'],
                descriptionKey:
                    'keyboardShortcuts.descriptions.navigation.trade',
            },
            {
                id: 'navigation.home',
                keys: ['h'],
                descriptionKey:
                    'keyboardShortcuts.descriptions.navigation.home',
            },
            {
                id: 'navigation.portfolio',
                keys: ['p'],
                descriptionKey:
                    'keyboardShortcuts.descriptions.navigation.portfolio',
            },
            {
                id: 'wallet.connect',
                keys: ['c'],
                descriptionKey: 'keyboardShortcuts.descriptions.wallet.connect',
            },
            {
                id: 'portfolio.deposit',
                keys: ['d'],
                descriptionKey:
                    'keyboardShortcuts.descriptions.portfolio.deposit',
            },
            {
                id: 'portfolio.withdraw',
                keys: ['w'],
                descriptionKey:
                    'keyboardShortcuts.descriptions.portfolio.withdraw',
            },
            {
                id: 'portfolio.latestTx',
                keys: ['e'],
                descriptionKey:
                    'keyboardShortcuts.descriptions.portfolio.latestTx',
            },
        ],
    },
];

export function getDefaultShortcutKeys(id: string): ShortcutKeyToken[] {
    for (const category of DEFAULT_SHORTCUT_CATEGORIES) {
        const shortcut = category.shortcuts.find((s) => s.id === id);
        if (shortcut) return shortcut.keys;
    }
    return [];
}

export function getCustomShortcuts(): Record<string, ShortcutKeyToken[]> {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(CUSTOM_SHORTCUTS_STORAGE_KEY);
        if (!stored) return {};
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
            return parsed as Record<string, ShortcutKeyToken[]>;
        }
    } catch {
        // ignore
    }
    return {};
}

export function setCustomShortcut(id: string, keys: ShortcutKeyToken[]): void {
    if (typeof window === 'undefined') return;
    const current = getCustomShortcuts();
    const defaultKeys = getDefaultShortcutKeys(id);

    if (
        keys.length === defaultKeys.length &&
        keys.every((k, i) => k === defaultKeys[i])
    ) {
        delete current[id];
    } else {
        current[id] = keys;
    }

    if (Object.keys(current).length === 0) {
        localStorage.removeItem(CUSTOM_SHORTCUTS_STORAGE_KEY);
    } else {
        localStorage.setItem(
            CUSTOM_SHORTCUTS_STORAGE_KEY,
            JSON.stringify(current),
        );
    }
}

export function resetAllCustomShortcuts(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(CUSTOM_SHORTCUTS_STORAGE_KEY);
}

export function hasCustomShortcuts(): boolean {
    return Object.keys(getCustomShortcuts()).length > 0;
}

function getEffectiveKeys(id: string): ShortcutKeyToken[] {
    const custom = getCustomShortcuts();
    if (custom[id]) return custom[id];
    return getDefaultShortcutKeys(id);
}

function normalizeToken(token: string): string {
    return token.trim().toLowerCase();
}

export function isMacPlatform(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /mac/i.test(navigator.platform);
}

function tokenIsModifier(token: string): boolean {
    const t = normalizeToken(token);
    return (
        t === 'shift' ||
        t === 'alt' ||
        t === 'option' ||
        t === 'opt' ||
        t === 'ctrl' ||
        t === 'control' ||
        t === 'meta' ||
        t === 'cmd' ||
        t === 'command' ||
        t === 'mod'
    );
}

function requiredModifiersFromTokens(tokens: string[]): {
    shift: boolean;
    alt: boolean;
    ctrl: boolean;
    meta: boolean;
} {
    const set = new Set(tokens.map(normalizeToken));

    const mac = isMacPlatform();

    const mod = set.has('mod');
    const meta = set.has('meta') || set.has('cmd') || set.has('command');
    const ctrl = set.has('ctrl') || set.has('control');
    const alt = set.has('alt') || set.has('option') || set.has('opt');

    return {
        shift: set.has('shift'),
        alt,
        ctrl: mod ? !mac : ctrl,
        meta: mod ? mac : meta,
    };
}

function mainKeyTokenFromTokens(tokens: string[]): string | null {
    const nonModifiers = tokens.filter((t) => !tokenIsModifier(t));
    if (nonModifiers.length === 0) return null;
    if (nonModifiers.length === 1) return nonModifiers[0];
    return nonModifiers[nonModifiers.length - 1];
}

function eventMatchesMainKey(e: KeyboardEvent, token: string): boolean {
    const t = normalizeToken(token);

    if (t === 'esc' || t === 'escape') return e.key === 'Escape';
    if (t === 'enter' || t === 'return') return e.key === 'Enter';

    if (t === ',' || t === 'comma') {
        return e.code === 'Comma' || e.key === ',';
    }

    if (t === 'slash' || t === '/') {
        return e.code === 'Slash' || e.key === '/';
    }

    if (t === '?') {
        return e.key === '?' || (e.shiftKey && e.code === 'Slash');
    }

    if (t.length === 1) {
        if (e.key.toLowerCase() === t) return true;

        // If the user has a key remapping, `e.code` refers to the physical key.
        // Only fall back to `e.code` when a modifier is held (e.g. Option/Alt),
        // because some layouts/platforms can produce non-letter `e.key` values.
        // For unmodified letter shortcuts, prefer `e.key` to respect remaps.
        const hasModifier = e.altKey || e.ctrlKey || e.metaKey;
        if (!hasModifier) return false;

        return e.code.toLowerCase() === `key${t}`.toLowerCase();
    }

    return e.key.toLowerCase() === t;
}

export function matchesShortcutEvent(
    e: KeyboardEvent,
    keys: string[],
): boolean {
    const mainToken = mainKeyTokenFromTokens(keys);
    if (!mainToken) return false;

    const required = requiredModifiersFromTokens(keys);

    if (!!e.shiftKey !== required.shift) return false;
    if (!!e.altKey !== required.alt) return false;
    if (!!e.ctrlKey !== required.ctrl) return false;
    if (!!e.metaKey !== required.meta) return false;

    return eventMatchesMainKey(e, mainToken);
}

export function getKeyboardShortcutCategories(
    t: TFunctionLike,
): KeyboardShortcutCategory[] {
    return DEFAULT_SHORTCUT_CATEGORIES.map((cat) => {
        const title = String(
            t(cat.titleKey, { defaultValue: cat.titleKey }) ?? cat.titleKey,
        );

        const shortcuts: KeyboardShortcutItem[] = cat.shortcuts.map((s) => {
            const description = String(
                t(s.descriptionKey, { defaultValue: s.descriptionKey }) ??
                    s.descriptionKey,
            );
            const keys = getEffectiveKeys(s.id);
            return { id: s.id, description, keys };
        });

        return { title, shortcuts };
    });
}

export function getKeyboardShortcutById(
    categories: KeyboardShortcutCategory[],
    id: string,
): KeyboardShortcutItem | null {
    for (const category of categories) {
        const found = category.shortcuts.find((s) => s.id === id);
        if (found) return found;
    }
    return null;
}

export function formatKeyboardShortcutKey(
    token: string,
    t: TFunctionLike,
): string {
    const normalized = normalizeToken(token);
    const mac = isMacPlatform();

    if (normalized === 'mod') {
        const fallback = mac ? 'Cmd' : 'Ctrl';
        const resolvedToken = mac ? 'cmd' : 'ctrl';
        const osSpecificKey = mac
            ? `keyboardShortcuts.keyLabelsMac.${resolvedToken}`
            : `keyboardShortcuts.keyLabelsWin.${resolvedToken}`;
        const baseKey = `keyboardShortcuts.keyLabels.${resolvedToken}`;

        const osValue = t(osSpecificKey, { defaultValue: '' });
        if (typeof osValue === 'string' && osValue) return osValue;

        const baseValue = t(baseKey, { defaultValue: '' });
        if (typeof baseValue === 'string' && baseValue) return baseValue;

        return fallback;
    }

    const baseKey = `keyboardShortcuts.keyLabels.${normalized}`;
    const osKey = mac
        ? `keyboardShortcuts.keyLabelsMac.${normalized}`
        : `keyboardShortcuts.keyLabelsWin.${normalized}`;

    const osValue = t(osKey, { defaultValue: '' });
    if (typeof osValue === 'string' && osValue) return osValue;

    const baseValue = t(baseKey, { defaultValue: '' });
    if (typeof baseValue === 'string' && baseValue) return baseValue;

    if (normalized.length === 1) return normalized.toUpperCase();

    return token;
}
