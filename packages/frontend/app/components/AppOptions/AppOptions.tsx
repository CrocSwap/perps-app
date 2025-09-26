import { FaCircle } from 'react-icons/fa';
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

export interface appOptionDataIF {
    slug: appOptions;
    text: string;
}

export default function AppOptions() {
    const activeOptions: useAppOptionsIF = useAppOptions();

    const isMobileVersion = useMediaQuery('(max-width: 768px)');

    const { numFormat, setNumFormat, bsColor, setBsColor, getBsColor } =
        useAppSettings();
    const { i18n, t } = useTranslation();

    // !important:  this file instantiates children directly instead of using
    // !important:  ... .map() functions so we can easily mix different types
    // !important:  ... of interactables in sequence in the modal

    // gap between colored circles in the color pair dropdown
    const CIRCLE_GAP = '1px';

    return (
        <section className={styles.app_options}>
            <ul>
                <OptionLine
                    text={t('appSettings.skipOpenOrderConfirm')}
                    isChecked={activeOptions['skipOpenOrderConfirm']}
                    toggle={() => {
                        activeOptions.toggle('skipOpenOrderConfirm');
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
                {/* <OptionLine
                    text='Skip Close Position Confirmations'
                    isChecked={activeOptions['skipClosePositionConfirm']}
                    toggle={() =>
                        activeOptions.toggle('skipClosePositionConfirm')
                        // activeOptions.enable('skipClosePositionConfirm')
                    }
                /> */}
                {/* <OptionLine
                    text='Opt Out of Spot Dusting'
                    isChecked={activeOptions['optOutSpotDusting']}
                    toggle={() => activeOptions.toggle('optOutSpotDusting')}
                /> */}
                {/* <OptionLine
                    text='Persist Trading Connection'
                    isChecked={activeOptions['persistTradingConnection']}
                    toggle={() =>
                        activeOptions.toggle('persistTradingConnection')
                    }
                /> */}
            </ul>
            {/* divider */}
            {/* <div className={styles.horizontal_divider} /> */}
            <ul>
                {/* <OptionLine
                    text={t('appSettings.displayVerboseErrors')}
                    isChecked={activeOptions['displayVerboseErrors']}
                    toggle={() => activeOptions.toggle('displayVerboseErrors')}
                /> */}
                <OptionLine
                    text={t('appSettings.enableTxNotifications')}
                    isChecked={activeOptions['enableTxNotifications']}
                    toggle={() => {
                        activeOptions.toggle('enableTxNotifications');
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
                {/* <OptionLine
                    text='Play Sound for Fills'
                    isChecked={activeOptions['playFillSound']}
                    toggle={() => activeOptions.toggle('playFillSound')}
                /> */}
                {/* <OptionLine
                    text='Animate Order Book'
                    isChecked={activeOptions['animateOrderBook']}
                    toggle={() => activeOptions.toggle('animateOrderBook')}
                /> */}
                {/* <OptionLine
                    text='Order Book Set Size on Click'
                    isChecked={activeOptions['clickToSetOrderBookSize']}
                    toggle={() =>
                        activeOptions.toggle('clickToSetOrderBookSize')
                    }
                /> */}
                {/* <OptionLine
                    text='Show Buys and Sells on Chart'
                    isChecked={activeOptions['showBuysSellsOnChart']}
                    toggle={() => activeOptions.toggle('showBuysSellsOnChart')}
                /> */}
                {/* <OptionLine
                    text='Show PnL'
                    isChecked={activeOptions['showPnL']}
                    toggle={() => activeOptions.toggle('showPnL')}
                /> */}
                {/* <OptionLine
                    text='Show All Warnings'
                    isChecked={activeOptions['showAllWarnings']}
                    toggle={() => activeOptions.toggle('showAllWarnings')}
                /> */}
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
            <div
                className={styles.apply_defaults}
                onClick={() => {
                    activeOptions.applyDefaults();
                    setNumFormat(NumFormatTypes[0]);
                    setBsColor('colors.default');
                    useAppSettings.getState().resetLayoutHeights();

                    // reset language to browser default or English if unsupported
                    const defaultLanguage = getDefaultLanguage();
                    i18n.changeLanguage(defaultLanguage);

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
                {t('common.applyDefaults')}
            </div>

            {/* <div
                className={styles.apply_defaults}
                onClick={() => {
                    // Clear persisted split height
                    localStorage.removeItem('chartTopHeight');
                    // Tell the Trade page to recompute defaults immediately
                    window.dispatchEvent(new CustomEvent('trade:resetLayout'));
                }}
            >
                Reset Layout (Chart/Table)
            </div> */}
        </section>
    );
}
