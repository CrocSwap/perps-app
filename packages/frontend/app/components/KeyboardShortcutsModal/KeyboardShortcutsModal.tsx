import { useEffect, useState, useCallback } from 'react';
import { MdClose, MdEdit } from 'react-icons/md';
import { FaKeyboard } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './KeyboardShortcutsModal.module.css';
import { useAppSettings } from '~/stores/AppSettingsStore';

import {
    formatKeyboardShortcutKey,
    getKeyboardShortcutCategories,
    setCustomShortcut,
    resetAllCustomShortcuts,
    hasCustomShortcuts,
    isMacPlatform,
    type ShortcutKeyToken,
} from '~/utils/keyboardShortcuts';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function eventToTokens(e: KeyboardEvent): ShortcutKeyToken[] {
    const tokens: ShortcutKeyToken[] = [];
    const mac = isMacPlatform();

    if (e.metaKey) tokens.push(mac ? 'cmd' : 'meta');
    if (e.ctrlKey) tokens.push('ctrl');
    if (e.altKey) tokens.push(mac ? 'option' : 'alt');
    if (e.shiftKey) tokens.push('shift');

    const key = e.key;
    if (
        key !== 'Meta' &&
        key !== 'Control' &&
        key !== 'Alt' &&
        key !== 'Shift'
    ) {
        if (key === 'Escape') tokens.push('esc');
        else if (key === 'Enter') tokens.push('enter');
        else if (key.length === 1) tokens.push(key.toLowerCase());
        else tokens.push(key.toLowerCase());
    }

    return tokens;
}

const KeyboardShortcutsModal = ({
    isOpen,
    onClose,
}: KeyboardShortcutsModalProps) => {
    const { t } = useTranslation();
    const [refreshKey, setRefreshKey] = useState(0);
    const shortcutCategories = getKeyboardShortcutCategories(t);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [pendingKeys, setPendingKeys] = useState<ShortcutKeyToken[]>([]);
    const [showApplyDefaults, setShowApplyDefaults] =
        useState(hasCustomShortcuts());
    const {
        navigationKeyboardShortcutsEnabled,
        setNavigationKeyboardShortcutsEnabled,
        tradingKeyboardShortcutsEnabled,
        setTradingKeyboardShortcutsEnabled,
    } = useAppSettings();

    const refreshCategories = useCallback(() => {
        setRefreshKey((k) => k + 1);
        setShowApplyDefaults(hasCustomShortcuts());
    }, []);

    const handleStartEdit = useCallback((id: string) => {
        setEditingId(id);
        setPendingKeys([]);
    }, []);

    const handleCancelEdit = useCallback(() => {
        setEditingId(null);
        setPendingKeys([]);
    }, []);

    const handleApplyDefaults = useCallback(() => {
        resetAllCustomShortcuts();
        refreshCategories();
    }, [refreshCategories]);

    const reportSettingChange = (setting: string, value: boolean) => {
        if (typeof plausible === 'function') {
            plausible('Settings Change', {
                props: {
                    setting,
                    value,
                },
            });
        }
    };

    const getToggleKindForCategory = (
        category: (typeof shortcutCategories)[number],
    ): 'navigation' | 'trading' | null => {
        if (
            category.shortcuts.some((s) =>
                s.id.toLowerCase().startsWith('trading.'),
            )
        ) {
            return 'trading';
        }

        if (
            category.shortcuts.some((s) => {
                const id = s.id.toLowerCase();
                return (
                    id.startsWith('navigation.') ||
                    id.startsWith('wallet.') ||
                    id.startsWith('portfolio.')
                );
            })
        ) {
            return 'navigation';
        }

        return null;
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (editingId) {
                e.preventDefault();
                e.stopPropagation();

                if (e.key === 'Escape') {
                    handleCancelEdit();
                    return;
                }

                const tokens = eventToTokens(e);
                if (tokens.length > 0) {
                    const hasNonModifier = tokens.some(
                        (t) =>
                            ![
                                'shift',
                                'ctrl',
                                'alt',
                                'option',
                                'cmd',
                                'meta',
                            ].includes(t),
                    );
                    if (hasNonModifier) {
                        setCustomShortcut(editingId, tokens);
                        setEditingId(null);
                        setPendingKeys([]);
                        refreshCategories();
                    } else {
                        setPendingKeys(tokens);
                    }
                }
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose, editingId, handleCancelEdit, refreshCategories]);

    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                role='dialog'
                aria-modal='true'
                aria-labelledby='keyboard-shortcuts-title'
            >
                <header className={styles.header}>
                    <div className={styles.titleRow}>
                        <FaKeyboard className={styles.titleIcon} />
                        <h2 id='keyboard-shortcuts-title'>
                            {t('keyboardShortcuts.title')}
                        </h2>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label={t('keyboardShortcuts.aria.close')}
                    >
                        <MdClose size={20} />
                    </button>
                </header>

                <div className={styles.content}>
                    {shortcutCategories.map((category) =>
                        (() => {
                            const toggleKind =
                                getToggleKindForCategory(category);
                            const isDisabled =
                                toggleKind === 'navigation'
                                    ? !navigationKeyboardShortcutsEnabled
                                    : toggleKind === 'trading'
                                      ? !tradingKeyboardShortcutsEnabled
                                      : false;
                            const toggle =
                                toggleKind === 'navigation'
                                    ? () =>
                                          (() => {
                                              const nextEnabled =
                                                  !navigationKeyboardShortcutsEnabled;
                                              setNavigationKeyboardShortcutsEnabled(
                                                  nextEnabled,
                                              );
                                              reportSettingChange(
                                                  'navigationKeyboardShortcutsEnabled',
                                                  nextEnabled,
                                              );
                                          })()
                                    : toggleKind === 'trading'
                                      ? () =>
                                            (() => {
                                                const nextEnabled =
                                                    !tradingKeyboardShortcutsEnabled;
                                                setTradingKeyboardShortcutsEnabled(
                                                    nextEnabled,
                                                );
                                                reportSettingChange(
                                                    'tradingKeyboardShortcutsEnabled',
                                                    nextEnabled,
                                                );
                                            })()
                                      : null;
                            const toggleLabel =
                                toggleKind === 'navigation'
                                    ? t(
                                          'appSettings.navigationKeyboardShortcuts',
                                      )
                                    : toggleKind === 'trading'
                                      ? t(
                                            'appSettings.tradingKeyboardShortcuts',
                                        )
                                      : '';

                            return (
                                <section
                                    key={category.title}
                                    className={styles.category}
                                    data-disabled={
                                        isDisabled ? 'true' : 'false'
                                    }
                                >
                                    <div className={styles.categoryHeader}>
                                        <h3 className={styles.categoryTitle}>
                                            {category.title}
                                        </h3>
                                        {toggleKind && toggle && (
                                            <button
                                                type='button'
                                                className={
                                                    styles.categoryToggle
                                                }
                                                data-enabled={
                                                    !isDisabled
                                                        ? 'true'
                                                        : 'false'
                                                }
                                                aria-pressed={!isDisabled}
                                                aria-label={toggleLabel}
                                                onClick={toggle}
                                            >
                                                <span
                                                    className={
                                                        styles.categoryToggleKnob
                                                    }
                                                />
                                            </button>
                                        )}
                                    </div>
                                    <ul className={styles.shortcutList}>
                                        {category.shortcuts.map(
                                            (shortcut, index) => (
                                                <li
                                                    key={index}
                                                    className={
                                                        styles.shortcutItem
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.description
                                                        }
                                                    >
                                                        {shortcut.description}
                                                    </span>
                                                    <div
                                                        className={
                                                            styles.keysWrapper
                                                        }
                                                    >
                                                        {editingId ===
                                                        shortcut.id ? (
                                                            <span
                                                                className={
                                                                    styles.keysEditing
                                                                }
                                                            >
                                                                {pendingKeys.length >
                                                                0 ? (
                                                                    pendingKeys.map(
                                                                        (
                                                                            key,
                                                                            keyIndex,
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    keyIndex
                                                                                }
                                                                            >
                                                                                <kbd
                                                                                    className={
                                                                                        styles.key
                                                                                    }
                                                                                >
                                                                                    {formatKeyboardShortcutKey(
                                                                                        key,
                                                                                        t,
                                                                                    )}
                                                                                </kbd>
                                                                                {keyIndex <
                                                                                    pendingKeys.length -
                                                                                        1 && (
                                                                                    <span
                                                                                        className={
                                                                                            styles.keySeparator
                                                                                        }
                                                                                    >
                                                                                        +
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        ),
                                                                    )
                                                                ) : (
                                                                    <span
                                                                        className={
                                                                            styles.pressKeysHint
                                                                        }
                                                                    >
                                                                        {t(
                                                                            'keyboardShortcuts.pressKeys',
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    styles.keys
                                                                }
                                                            >
                                                                {shortcut.keys.map(
                                                                    (
                                                                        key,
                                                                        keyIndex,
                                                                    ) => (
                                                                        <span
                                                                            key={
                                                                                keyIndex
                                                                            }
                                                                        >
                                                                            <kbd
                                                                                className={
                                                                                    styles.key
                                                                                }
                                                                            >
                                                                                {formatKeyboardShortcutKey(
                                                                                    key,
                                                                                    t,
                                                                                )}
                                                                            </kbd>
                                                                            {keyIndex <
                                                                                shortcut
                                                                                    .keys
                                                                                    .length -
                                                                                    1 && (
                                                                                <span
                                                                                    className={
                                                                                        styles.keySeparator
                                                                                    }
                                                                                >
                                                                                    +
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    ),
                                                                )}
                                                            </span>
                                                        )}
                                                        <button
                                                            type='button'
                                                            className={
                                                                styles.editButton
                                                            }
                                                            onClick={() =>
                                                                editingId ===
                                                                shortcut.id
                                                                    ? handleCancelEdit()
                                                                    : handleStartEdit(
                                                                          shortcut.id,
                                                                      )
                                                            }
                                                            aria-label={t(
                                                                'keyboardShortcuts.editShortcut',
                                                            )}
                                                            data-editing={
                                                                editingId ===
                                                                shortcut.id
                                                                    ? 'true'
                                                                    : 'false'
                                                            }
                                                        >
                                                            <MdEdit size={14} />
                                                        </button>
                                                    </div>
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </section>
                            );
                        })(),
                    )}
                </div>

                <footer className={styles.footer}>
                    {showApplyDefaults && (
                        <button
                            type='button'
                            className={styles.applyDefaultsButton}
                            onClick={handleApplyDefaults}
                        >
                            {t('keyboardShortcuts.applyDefaults')}
                        </button>
                    )}
                    <span className={styles.hint}>
                        {t('keyboardShortcuts.hintPress')}{' '}
                        <kbd className={styles.key}>
                            {formatKeyboardShortcutKey('esc', t)}
                        </kbd>{' '}
                        {t('keyboardShortcuts.hintToClose')}
                    </span>
                </footer>
            </div>
        </div>
    );
};

export default KeyboardShortcutsModal;
