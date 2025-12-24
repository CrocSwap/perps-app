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

type TFunctionLike = (key: string, options?: TOptions) => unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function normalizeToken(token: string): string {
    return token.trim().toLowerCase();
}

function isMacPlatform(): boolean {
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

    if (t === 'slash' || t === '/') {
        return e.code === 'Slash' || e.key === '/';
    }

    if (t === '?') {
        return e.key === '?' || (e.shiftKey && e.code === 'Slash');
    }

    if (t.length === 1) {
        return e.key.toLowerCase() === t;
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
    const raw = t('keyboardShortcuts.categories', { returnObjects: true });

    if (!Array.isArray(raw)) return [];

    return raw
        .map((cat: unknown) => {
            const catRec = isRecord(cat) ? cat : null;
            const title =
                catRec && typeof catRec.title === 'string' ? catRec.title : '';

            const shortcutsRaw =
                catRec && Array.isArray(catRec.shortcuts)
                    ? (catRec.shortcuts as unknown[])
                    : [];

            const shortcuts: KeyboardShortcutItem[] = shortcutsRaw
                .map((s: unknown) => {
                    const sRec = isRecord(s) ? s : null;
                    const id =
                        sRec && typeof sRec.id === 'string' ? sRec.id : '';
                    const description =
                        sRec && typeof sRec.description === 'string'
                            ? sRec.description
                            : '';
                    const keys =
                        sRec && Array.isArray(sRec.keys)
                            ? (sRec.keys as unknown[]).filter(
                                  (k): k is string => typeof k === 'string',
                              )
                            : [];

                    return { id, description, keys };
                })
                .filter((s: KeyboardShortcutItem) =>
                    Boolean(s.id && s.description && s.keys.length > 0),
                );

            return { title, shortcuts };
        })
        .filter((c: KeyboardShortcutCategory) =>
            Boolean(c.title && c.shortcuts.length > 0),
        );
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
