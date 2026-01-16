import { FaCircle } from 'react-icons/fa';
import { useState, useEffect, useRef } from 'react';
import {
    useAppOptions,
    type appOptions,
    type useAppOptionsIF,
} from '~/stores/AppOptionsStore';
import {
    bsColorSets,
    useAppSettings,
    type colorSetIF,
    type colorSetNames,
} from '~/stores/AppSettingsStore';
import {
    languageOptions,
    NumFormatTypes,
    type NumFormat,
} from '~/utils/Constants';
import styles from './AppOptions.module.css';
import OptionLine from './OptionLine';
import OptionLineSelect from './OptionLineSelect';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '~/hooks/useMediaQuery';
import { getDefaultLanguage } from '~/utils/functions/getDefaultLanguage';
import { useKeyboardShortcuts } from '~/contexts/KeyboardShortcutsContext';

export interface appOptionDataIF {
    slug: appOptions;
    text: string;
}
interface AppOptionsProps {
    footer?: boolean;
    closePanel?: () => void;
}

export default function AppOptions(props: AppOptionsProps) {
    const { footer } = props;
    const activeOptions: useAppOptionsIF = useAppOptions();
    const { open: openKeyboardShortcuts } = useKeyboardShortcuts();

    const isMobileVersion = useMediaQuery('(max-width: 768px)');

    const {
        numFormat,
        setNumFormat,
        bsColor,
        setBsColor,
        getBsColor,
        navigationKeyboardShortcutsEnabled,
        setNavigationKeyboardShortcutsEnabled,
        tradingKeyboardShortcutsEnabled,
        setTradingKeyboardShortcutsEnabled,
    } = useAppSettings();
    const { i18n, t } = useTranslation();

    // Get translation function for the user's default language (for Apply Defaults button)
    const defaultLanguage = getDefaultLanguage();
    const tDefault = i18n.getFixedT(defaultLanguage);

    const [showChangeApplied, setShowChangeApplied] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Check if current settings are defaults
    const isDefaults =
        activeOptions['skipOpenOrderConfirm'] === false &&
        activeOptions['enableTxNotifications'] === true &&
        activeOptions['enableBackgroundFillNotif'] === true &&
        navigationKeyboardShortcutsEnabled === true &&
        tradingKeyboardShortcutsEnabled === true &&
        numFormat.label === NumFormatTypes[0].label &&
        bsColor === 'colors.default' &&
        (i18n?.language?.split('-')[0] || 'en') === defaultLanguage;

    const showChangeAppliedMessage = () => {
        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setShowChangeApplied(true);
        timeoutRef.current = setTimeout(() => {
            setShowChangeApplied(false);
        }, 2000);
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // !important:  this file instantiates children directly instead of using
    // !important:  ... .map() functions so we can easily mix different types
    // !important:  ... of interactables in sequence in the modal

    // gap between colored circles in the color pair dropdown
    const CIRCLE_GAP = '1px';

    return (
        <section
            className={`${styles.app_options} ${footer ? styles.footer_container : ''}`}
        >
            <ul>
                <OptionLine
                    text={t('appSettings.skipOpenOrderConfirm')}
                    isChecked={activeOptions['skipOpenOrderConfirm']}
                    autoFocus={!footer}
                    toggle={() => {
                        activeOptions.toggle('skipOpenOrderConfirm');
                        showChangeAppliedMessage();
                        if (typeof plausible === 'function') {
                            plausible('Settings Change', {
                                props: {
                                    setting: 'skipOpenOrderConfirm',
                                    value: !activeOptions[
                                        'skipOpenOrderConfirm'
                                    ],
                                },
                            });
                        }
                    }}
                />
            </ul>
            <ul>
                <OptionLine
                    text={t('appSettings.enableTxNotifications')}
                    isChecked={activeOptions['enableTxNotifications']}
                    toggle={() => {
                        activeOptions.toggle('enableTxNotifications');
                        showChangeAppliedMessage();
                        if (typeof plausible === 'function') {
                            plausible('Settings Change', {
                                props: {
                                    setting: 'enableTxNotifications',
                                    value: !activeOptions[
                                        'enableTxNotifications'
                                    ],
                                },
                            });
                        }
                    }}
                />
                <OptionLine
                    text={t('appSettings.enableBackgroundFillNotif')}
                    isChecked={activeOptions['enableBackgroundFillNotif']}
                    toggle={() => {
                        activeOptions.toggle('enableBackgroundFillNotif');
                        showChangeAppliedMessage();
                        if (typeof plausible === 'function') {
                            plausible('Settings Change', {
                                props: {
                                    setting: 'enableBackgroundFillNotif',
                                    value: !activeOptions[
                                        'enableBackgroundFillNotif'
                                    ],
                                },
                            });
                        }
                    }}
                />
            </ul>
            <div className={styles.horizontal_divider} />
            <ul>
                <OptionLine
                    text={t('appSettings.navigationKeyboardShortcuts')}
                    isChecked={navigationKeyboardShortcutsEnabled}
                    toggle={() => {
                        setNavigationKeyboardShortcutsEnabled(
                            !navigationKeyboardShortcutsEnabled,
                        );
                        showChangeAppliedMessage();
                        if (typeof plausible === 'function') {
                            plausible('Settings Change', {
                                props: {
                                    setting:
                                        'navigationKeyboardShortcutsEnabled',
                                    value: !navigationKeyboardShortcutsEnabled,
                                },
                            });
                        }
                    }}
                />
                <OptionLine
                    text={t('appSettings.tradingKeyboardShortcuts')}
                    isChecked={tradingKeyboardShortcutsEnabled}
                    toggle={() => {
                        setTradingKeyboardShortcutsEnabled(
                            !tradingKeyboardShortcutsEnabled,
                        );
                        showChangeAppliedMessage();
                        if (typeof plausible === 'function') {
                            plausible('Settings Change', {
                                props: {
                                    setting: 'tradingKeyboardShortcutsEnabled',
                                    value: !tradingKeyboardShortcutsEnabled,
                                },
                            });
                        }
                    }}
                />
                <li className={styles.shortcutsLinkRow}>
                    <button
                        type='button'
                        className={styles.shortcutsLink}
                        onClick={() => {
                            props.closePanel?.();
                            openKeyboardShortcuts();
                        }}
                    >
                        {t('appSettings.viewKeyboardShortcuts')}
                    </button>
                </li>
            </ul>
            <div className={styles.horizontal_divider} />
            <ul>
                <OptionLineSelect
                    text={t('appSettings.numberFormat')}
                    active={numFormat.label}
                    options={NumFormatTypes.map((n: NumFormat) => ({
                        readable: n.label,
                        set: () => {
                            setNumFormat(n);
                            showChangeAppliedMessage();
                            if (typeof plausible === 'function') {
                                plausible('Settings Change', {
                                    props: {
                                        setting: 'numberFormat',
                                        value: n.label,
                                    },
                                });
                            }
                        },
                    }))}
                />
                <OptionLineSelect
                    text={t('appSettings.color')}
                    dropDirection={isMobileVersion ? 'up' : 'down'}
                    active={
                        <div style={{ gap: '10px' }}>
                            <div>{t(bsColor.toString())}</div>
                            <div style={{ gap: CIRCLE_GAP }}>
                                <FaCircle color={getBsColor().buy} />
                                <FaCircle color={getBsColor().sell} />
                            </div>
                        </div>
                    }
                    options={Object.entries(bsColorSets).map(
                        (c: [string, colorSetIF]) => {
                            const [text, colors]: [string, colorSetIF] = c;
                            return {
                                readable: (
                                    <>
                                        <div>{t(text)}</div>
                                        <div style={{ gap: CIRCLE_GAP }}>
                                            <FaCircle color={colors.buy} />
                                            <FaCircle color={colors.sell} />
                                        </div>
                                    </>
                                ),
                                set: () => {
                                    setBsColor(text as colorSetNames);
                                    showChangeAppliedMessage();
                                    if (typeof plausible === 'function') {
                                        plausible('Settings Change', {
                                            props: {
                                                setting: 'colorScheme',
                                                value: text,
                                            },
                                        });
                                    }
                                },
                            };
                        },
                    )}
                />
                <OptionLineSelect
                    text={t('appSettings.language')}
                    dropDirection={isMobileVersion ? 'up' : 'down'}
                    active={
                        <div>
                            {
                                languageOptions[
                                    (i18n?.language?.split('-')[0] ||
                                        'en') as keyof typeof languageOptions
                                ]
                            }
                        </div>
                    }
                    options={Object.entries(languageOptions).map(
                        (lang: [string, string]) => {
                            return {
                                readable: <div>{lang[1]}</div>,
                                set: () => {
                                    i18n.changeLanguage(lang[0]);
                                    showChangeAppliedMessage();
                                    if (typeof plausible === 'function') {
                                        plausible('Settings Change', {
                                            props: {
                                                setting: 'language',
                                                value: lang[1].split(' ')[0],
                                            },
                                        });
                                    }
                                },
                            };
                        },
                    )}
                />
            </ul>
            <div className={styles.actions_container}>
                {showChangeApplied ? (
                    <div
                        className={styles.change_applied}
                        style={{
                            color: '#22c55e',
                            textAlign: 'center',
                            width: '100%',
                        }}
                    >
                        {t('common.changeApplied')}
                    </div>
                ) : (
                    !isDefaults && (
                        <button
                            type='button'
                            className={styles.apply_defaults}
                            style={{
                                background: 'var(--accent1)',
                                padding: 'var(--padding-xs)',
                                borderRadius: '0.375rem',
                                margin: '0 auto',
                            }}
                            onClick={() => {
                                activeOptions.applyDefaults();
                                setNumFormat(NumFormatTypes[0]);
                                setBsColor('colors.default');
                                useAppSettings.getState().resetLayoutHeights();
                                setNavigationKeyboardShortcutsEnabled(true);
                                setTradingKeyboardShortcutsEnabled(true);

                                const defaultLanguage = getDefaultLanguage();
                                i18n.changeLanguage(defaultLanguage);

                                showChangeAppliedMessage();
                                if (typeof plausible === 'function') {
                                    plausible('Settings Change', {
                                        props: {
                                            setting: 'applyDefaults',
                                            value: 'default',
                                        },
                                    });
                                }
                            }}
                        >
                            {tDefault('common.applyDefaults')}
                        </button>
                    )
                )}
            </div>
        </section>
    );
}
