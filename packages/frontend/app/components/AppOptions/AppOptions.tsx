import type { useModalIF } from '~/hooks/useModal';
import styles from './AppOptions.module.css';
import OptionLine from './OptionLine';
import {
    useAppOptions,
    type appOptions,
    type useAppOptionsIF,
} from '~/stores/AppOptionsStore';
import { MdOutlineClose } from 'react-icons/md';
import OptionLineSelect from './OptionLineSelect';
import {
    useAppSettings,
    bsColorSets,
    type colorSetIF,
} from '~/stores/AppSettingsStore';
import { NumFormatTypes, type NumFormat } from '~/utils/Constants';
import { FaCircle } from 'react-icons/fa';

export interface appOptionDataIF {
    slug: appOptions;
    text: string;
}

interface propsIF {
    modalControl: useModalIF;
}

export default function AppOptions(props: propsIF) {
    const { modalControl } = props;

    const activeOptions: useAppOptionsIF = useAppOptions();
    const { numFormat, setNumFormat, bsColor, setBsColor, getBsColor } =
        useAppSettings();

    // !important:  this file instantiates children directly instead of using
    // !important:  ... .map() functions so we can easily mix different types
    // !important:  ... of interactables in sequence in the modal

    // gap between colored circles in the color pair dropdown
    const CIRCLE_GAP = '1px';

    return (
        <section className={styles.app_options}>
            {/* <header>
                <div />
                <h2>Options</h2>
                <MdOutlineClose
                    size={20}
                    onClick={modalControl.close}
                    style={{ cursor: 'pointer' }}
                />
            </header> */}
            <ul>
                <OptionLine
                    text='Skip Open Order Confirmation'
                    isChecked={activeOptions['skipOpenOrderConfirm']}
                    toggle={() => activeOptions.toggle('skipOpenOrderConfirm')}
                />
                <OptionLine
                    text='Skip Close Position Confirmations'
                    isChecked={activeOptions['skipClosePositionConfirm']}
                    toggle={() =>
                        activeOptions.toggle('skipClosePositionConfirm')
                    }
                />
                <OptionLine
                    text='Opt Out of Spot Dusting'
                    isChecked={activeOptions['optOutSpotDusting']}
                    toggle={() => activeOptions.toggle('optOutSpotDusting')}
                />
                <OptionLine
                    text='Persist Trading Connection'
                    isChecked={activeOptions['persistTradingConnection']}
                    toggle={() =>
                        activeOptions.toggle('persistTradingConnection')
                    }
                />
            </ul>
            <div className={styles.horizontal_divider} />
            <ul>
                <OptionLine
                    text='Display Verbose Errors'
                    isChecked={activeOptions['displayVerboseErrors']}
                    toggle={() => activeOptions.toggle('displayVerboseErrors')}
                />
                <OptionLine
                    text='Enable Transaction Notifications'
                    isChecked={activeOptions['enableTxNotifications']}
                    toggle={() => activeOptions.toggle('enableTxNotifications')}
                />
                <OptionLine
                    text='Enable Background Fill Notifications'
                    isChecked={activeOptions['enableBackgroundFillNotif']}
                    toggle={() =>
                        activeOptions.toggle('enableBackgroundFillNotif')
                    }
                />
                <OptionLine
                    text='Play Sound for Fills'
                    isChecked={activeOptions['playFillSound']}
                    toggle={() => activeOptions.toggle('playFillSound')}
                />
                <OptionLine
                    text='Animate Order Book'
                    isChecked={activeOptions['animateOrderBook']}
                    toggle={() => activeOptions.toggle('animateOrderBook')}
                />
                <OptionLine
                    text='Order Book Set Size on Click'
                    isChecked={activeOptions['clickToSetOrderBookSize']}
                    toggle={() =>
                        activeOptions.toggle('clickToSetOrderBookSize')
                    }
                />
                <OptionLine
                    text='Show Buys and Sells on Chart'
                    isChecked={activeOptions['showBuysSellsOnChart']}
                    toggle={() => activeOptions.toggle('showBuysSellsOnChart')}
                />
                <OptionLine
                    text='Show PnL'
                    isChecked={activeOptions['showPnL']}
                    toggle={() => activeOptions.toggle('showPnL')}
                />
                <OptionLine
                    text='Show All Warnings'
                    isChecked={activeOptions['showAllWarnings']}
                    toggle={() => activeOptions.toggle('showAllWarnings')}
                />
            </ul>
            <div className={styles.horizontal_divider} />
            <ul>
                <OptionLineSelect
                    text='Number Format'
                    active={numFormat.label}
                    options={NumFormatTypes.map((n: NumFormat) => ({
                        readable: n.label,
                        set: () => setNumFormat(n),
                    }))}
                />
                <OptionLineSelect
                    text='Color'
                    active={
                        <div style={{ gap: '10px' }}>
                            <div>
                                {(bsColor as string)[0].toUpperCase() +
                                    (bsColor as string).slice(1)}
                            </div>
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
                                        <div>
                                            {text[0].toUpperCase() +
                                                text.slice(1)}
                                        </div>
                                        <div style={{ gap: CIRCLE_GAP }}>
                                            <FaCircle color={colors.buy} />
                                            <FaCircle color={colors.sell} />
                                        </div>
                                    </>
                                ),
                                set: () => setBsColor(text),
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
                    setBsColor('default');
                }}
            >
                Apply Defaults
            </div>
        </section>
    );
}
