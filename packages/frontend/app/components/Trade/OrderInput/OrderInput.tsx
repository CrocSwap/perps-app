import { useEffect, useMemo, useState } from 'react';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import { FiChevronDown } from 'react-icons/fi';
import Modal from '~/components/Modal/Modal';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useModal, type useModalIF } from '~/hooks/useModal';
import useNumFormatter from '~/hooks/useNumFormatter';
import {
    useNotificationStore,
    type NotificationStoreIF,
} from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { parseNum } from '~/utils/orderbook/OrderBookUtils';
import evenSvg from '../../../assets/icons/EvenPriceDistribution.svg';
import flatSvg from '../../../assets/icons/FlatPriceDistribution.svg';
import ChasePrice from './ChasePrice/ChasePrice';
import ConfirmationModal from './ConfirmationModal/ConfirmationModal';
import LeverageSlider from './LeverageSlider/LeverageSlider';
import MarginModal from './MarginModal/MarginModal';
import OrderDropdown from './OrderDropdown/OrderDropdown';
import styles from './OrderInput.module.css';
import PlaceOrderButtons from './PlaceOrderButtons/PlaceOrderButtons';
import PositionSize from './PositionSIze/PositionSize';
import PriceInput from './PriceInput/PriceInput';
import PriceRange from './PriceRange/PriceRange';
import ReduceAndProfitToggle from './ReduceAndProfitToggle/ReduceAndProfitToggle';
import RunningTime from './RunningTime/RunningTime';
import ScaleOrders from './ScaleOrders/ScaleOrders';
import SizeInput from './SizeInput/SizeInput';
import StopPrice from './StopPrice/StopPrice';
import { PiSquaresFour } from 'react-icons/pi';
import { MdKeyboardArrowLeft } from 'react-icons/md';
export interface OrderTypeOption {
    value: string;
    label: string;
    blurb: string;
}

export interface ChaseOption {
    value: string;
    label: string;
}

export type MarginMode = 'cross' | 'isolated' | null;

const marketOrderTypes: OrderTypeOption[] = [
    {
        value: 'market',
        label: 'Market',
        blurb: 'Buy/sell at the current price',
    },
    {
        value: 'limit',
        label: 'Limit',
        blurb: 'Buy/Sell at a specific price or better',
    },
    {
        value: 'scale',
        label: 'Scale',
        blurb: 'Multiple orders at incrementing prices',
    },
    {
        value: 'stop_limit',
        label: 'Stop Limit',
        blurb: 'Triggers a limit order at a set price',
    },
    {
        value: 'stop_market',
        label: 'Stop Market',
        blurb: 'Triggers a market order at a set price',
    },
    {
        value: 'twap',
        label: 'TWAP',
        blurb: 'Distributes trades across a specified time period',
    },
    {
        value: 'chase_limit',
        label: 'Chase Limit',
        blurb: 'Adjusts limit price to follow the market',
    },
];

const chaseOptionTypes: ChaseOption[] = [
    { value: 'bid1ask1', label: 'Bid1/Ask1' },
    { value: 'distancebidask1', label: 'Distance from Bid1/Ask1' },
];

const leverageOptions = [
    { value: 1, label: '1x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' },
    { value: 50, label: '50x' },
    { value: 100, label: '100x' },
];
const positionSizeOptions = [
    { value: 0, label: '0%' },
    { value: 25, label: '5%' },
    { value: 50, label: '10%' },
    { value: 75, label: '50%' },
    { value: 100, label: '100%' },
];

export default function OrderInput() {
    const [marketOrderType, setMarketOrderType] = useState<string>('market');
    const [activeMargin, setActiveMargin] = useState<MarginMode>('isolated');
    const [modalContent, setModalContent] = useState<
        'margin' | 'scale' | 'confirm_buy' | 'confirm_sell' | null
    >(null);

    const [leverage, setLeverage] = useState(100);
    const [size, setSize] = useState('');
    const [price, setPrice] = useState('');
    const [stopPrice, setStopPrice] = useState('');
    const [positionSize, setPositionSize] = useState(0);
    const [chaseOption, setChaseOption] = useState<string>('bid1ask1');
    const [isReduceOnlyEnabled, setIsReduceOnlyEnabled] = useState(false);
    const [isTakeProfitEnabled, setIsTakeProfitEnabled] = useState(false);
    const [isRandomizeEnabled, setIsRandomizeEnabled] = useState(false);
    const [isChasingIntervalEnabled, setIsChasingIntervalEnabled] =
        useState(false);
    const [priceRangeMin, setPriceRangeMin] = useState('86437.7');
    const [priceRangeMax, setPriceRangeMax] = useState('90000');
    const [priceRangeTotalOrders, setPriceRangeTotalOrders] = useState('2');

    const minimumInputValue = 2;
    const [tempMaximumLeverageInput, setTempMaximumLeverageInput] =
        useState<number>(100);
    const generateRandomMaximumInput = () => {
        console.log('generating');
        // Generate a random maximum between minimumInputValue and 100
        const newMaximumInputValue =
            Math.floor(Math.random() * (100 - minimumInputValue + 1)) +
            minimumInputValue;

        setTempMaximumLeverageInput(newMaximumInputValue);
    };

    const { obChosenPrice, obChosenAmount, symbol, symbolInfo } =
        useTradeDataStore();
    const { parseFormattedNum, formatNumWithOnlyDecimals } = useNumFormatter();

    const appSettingsModal: useModalIF = useModal('closed');

    const showPriceInputComponent = [
        'limit',
        'stop_limit',
        'chase_limit',
    ].includes(marketOrderType);

    const showPriceRangeComponent = marketOrderType === 'scale';

    const showStopPriceComponent = ['stop_limit', 'stop_market'].includes(
        marketOrderType,
    );

    const useTotalSize = ['twap', 'chase_limit'].includes(marketOrderType);

    const inputDetailsData = [
        {
            label: 'Available to Trade',
            tooltipLabel: 'available to trade',
            value: '0.00',
        },
        {
            label: 'Current Position',
            tooltipLabel: 'current position',
            value: `0.000 ${symbol}`,
        },
    ];

    useEffect(() => {
        /* -----------------------------------------------------------------------------------------------
        this code block has been commented out for now
        it was used to set the size of the order based on the clicked orderbook slot 
        */

        // if (obChosenAmount > 0) {
        //     setSize(formatNumWithOnlyDecimals(obChosenAmount));
        //     handleTypeChange();
        // }

        /* ----------------------------------------------------------------------------------------------- */

        if (obChosenPrice > 0) {
            setPrice(formatNumWithOnlyDecimals(obChosenPrice));
            handleTypeChange();
        }
    }, [obChosenAmount, obChosenPrice]);

    const orderValue = useMemo(() => {
        if (marketOrderType === 'market' || marketOrderType === 'stop_market') {
            return parseFormattedNum(size) * parseNum(symbolInfo?.markPx || 0);
        } else if (
            (marketOrderType === 'limit' || marketOrderType === 'stop_limit') &&
            price &&
            price.length > 0 &&
            size &&
            size.length > 0
        ) {
            return parseFormattedNum(size) * parseFormattedNum(price);
        }
        return 0;
    }, [
        size,
        price,
        marketOrderType,
        symbolInfo?.markPx,
        parseNum,
        parseFormattedNum,
    ]);

    useEffect(() => {
        setSize('');
        setPrice('');
    }, [symbol]);

    const handleTypeChange = () => {
        switch (marketOrderType) {
            case 'market':
                setMarketOrderType('limit');
                break;
            case 'stop_market':
                setMarketOrderType('stop_limit');
                break;
        }
    };

    const openModalWithContent = (
        content: 'margin' | 'scale' | 'confirm_buy' | 'confirm_sell',
    ) => {
        setModalContent(content);
        appSettingsModal.open();
    };

    const handleMarketOrderTypeChange = (value: string) => {
        setMarketOrderType(value);
        console.log(`Order type changed to: ${value}`);
    };
    const handleMarginModeChange = (mode: MarginMode) => {
        setActiveMargin(mode);
        console.log(`Mode changed to: ${mode}`);
    };

    const handleMarginModeConfirm = () => {
        if (activeMargin) {
            console.log(`Confirmed: ${activeMargin} margin mode`);
        }
        appSettingsModal.close();
    };
    const handleLeverageChange = (value: number) => {
        setLeverage(value);
        console.log(`Leverage changed to: ${value}x`);
    };

    // SIZE INPUT-----------------------------
    const handleSizeChange = (
        event: React.ChangeEvent<HTMLInputElement> | string,
    ) => {
        if (typeof event === 'string') {
            setSize(event);
        } else {
            setSize(event.target.value);
        }
    };

    const handleSizeBlur = () => {
        console.log('Input lost focus');
    };

    const handleSizeKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'Enter') {
            console.log('Enter pressed:', size);
        }
    };
    // PRICE INPUT----------------------------------
    const handlePriceChange = (
        event: React.ChangeEvent<HTMLInputElement> | string,
    ) => {
        if (typeof event === 'string') {
            setPrice(event);
        } else {
            setPrice(event.target.value);
        }
    };

    const handlePriceBlur = () => {
        console.log('Input lost focus');
    };

    const handlePriceKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'Enter') {
            console.log('Enter pressed:', price);
        }
    };
    // STOP PRICE----------------------------------------------------------
    const handleStopPriceChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setStopPrice(event.target.value);
    };

    const handleStopPriceBlur = () => {
        console.log('Input lost focus');
    };

    const handleStopPriceKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'Enter') {
            console.log('Enter pressed:', price);
        }
    };

    // POSITION SIZE------------------------------
    const handlePositionSizeChange = (value: number) => {
        setPositionSize(value);
        console.log(`PositionSize changed to: ${value}x`);
    };
    // CHASE OPTION---------------------------------------------------
    const handleChaseOptionChange = (value: string) => {
        setChaseOption(value);
        console.log(`Chase Option changed to: ${value}`);
    };

    // REDUCE AND PROFIT STOP LOSS -----------------------------------------------------

    const handleToggleReduceOnly = (newState?: boolean) => {
        const newValue =
            newState !== undefined ? newState : !isReduceOnlyEnabled;
        setIsReduceOnlyEnabled(newValue);
    };
    const handleToggleProfitOnly = (newState?: boolean) => {
        const newValue =
            newState !== undefined ? newState : !isTakeProfitEnabled;
        setIsTakeProfitEnabled(newValue);
    };
    const handleToggleRandomize = (newState?: boolean) => {
        const newValue =
            newState !== undefined ? newState : !isRandomizeEnabled;
        setIsRandomizeEnabled(newValue);
    };
    const handleToggleChasingInterval = (newState?: boolean) => {
        const newValue =
            newState !== undefined ? newState : !isChasingIntervalEnabled;
        setIsChasingIntervalEnabled(newValue);
    };

    // PRICE RANGE AND TOTAL ORDERS -----------------------------------------
    const handleMinPriceRange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value = event.target.value;
        if (/^\d*\.?\d*$/.test(value) && value.length <= 12) {
            setPriceRangeMin(value);
        }
    };

    const handleMaxPriceRange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value = event.target.value;
        if (/^\d*\.?\d*$/.test(value) && value.length <= 12) {
            setPriceRangeMax(value);
        }
    };
    const handleTotalordersPriceRange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value = event.target.value;
        if (/^\d*$/.test(value) && value.length <= 12) {
            setPriceRangeTotalOrders(value);
        }
    };

    // JSX RETURNS -----------------------------------
    const priceDistributionButtons = (
        <div className={styles.priceDistributionContainer}>
            <div className={styles.inputDetailsLabel}>
                <span>Price Distribution</span>
                <Tooltip content={'price distribution'} position='right'>
                    <AiOutlineQuestionCircle size={13} />
                </Tooltip>
            </div>
            <div className={styles.actionButtonsContainer}>
                <button onClick={() => openModalWithContent('scale')}>
                    <img src={flatSvg} alt='flat price distribution' />
                    Flat
                </button>
                <button onClick={() => openModalWithContent('scale')}>
                    <img src={evenSvg} alt='even price distribution' />
                    Evenly Split
                </button>
            </div>
        </div>
    );
    // -----------------------------PROPS----------------------------------------
    const reduceAndProfitToggleProps = {
        isReduceOnlyEnabled,
        isTakeProfitEnabled,
        handleToggleProfitOnly,
        handleToggleReduceOnly,
        marketOrderType,
        isRandomizeEnabled,
        handleToggleRandomize,
        isChasingIntervalEnabled,
        handleToggleIsChasingInterval: handleToggleChasingInterval,
    };

    const leverageSliderProps = {
        options: leverageOptions,
        value: leverage,
        onChange: handleLeverageChange,
        minimumInputValue: minimumInputValue,
        maximumInputValue: tempMaximumLeverageInput,
        generateRandomMaximumInput: generateRandomMaximumInput,
    };

    const chasePriceProps = {
        chaseOption,
        chaseOptionTypes,
        handleChaseOptionChange,
    };

    const stopPriceProps = {
        value: stopPrice,
        onChange: handleStopPriceChange,
        onBlur: handleStopPriceBlur,
        onKeyDown: handleStopPriceKeyDown,
        className: 'custom-input',
        ariaLabel: 'stop price input',
    };

    const priceInputProps = {
        value: price,
        onChange: handlePriceChange,
        onBlur: handlePriceBlur,
        onKeyDown: handlePriceKeyDown,
        className: 'custom-input',
        ariaLabel: 'Price input',
        showMidButton: ['stop_limit', 'limit'].includes(marketOrderType),
    };

    const sizeInputProps = {
        value: size,
        onChange: handleSizeChange,
        onBlur: handleSizeBlur,
        onKeyDown: handleSizeKeyDown,
        className: 'custom-input',
        ariaLabel: 'Size input',
        useTotalSize,
        symbol,
    };

    const positionSizeProps = {
        options: positionSizeOptions,
        value: positionSize,
        onChange: handlePositionSizeChange,
    };

    const priceRangeProps = {
        minValue: priceRangeMin,
        maxValue: priceRangeMax,
        handleChangeMin: handleMinPriceRange,
        handleChangeMax: handleMaxPriceRange,
        handleChangetotalOrders: handleTotalordersPriceRange,
        totalOrders: priceRangeTotalOrders,
    };

    const notifications: NotificationStoreIF = useNotificationStore();

    const [showLaunchpad, setShowLaunchpad] = useState<boolean>(false);

    return (
        <div className={styles.mainContainer}>
            {showLaunchpad ? (
                <div className={styles.launchpad}>
                    <header>
                        <div>
                            <MdKeyboardArrowLeft
                                onClick={() => setShowLaunchpad(false)}
                            />
                        </div>
                        <h3>Order Types</h3>
                        {/* empty <div> helps with spacing */}
                        <div />
                    </header>
                    <ul className={styles.launchpad_clickables}>
                        {marketOrderTypes.map((mo: OrderTypeOption) => (
                            <li
                                key={JSON.stringify(mo)}
                                onClick={() => {
                                    handleMarketOrderTypeChange(mo.value);
                                    setShowLaunchpad(false);
                                }}
                            >
                                <div>icon goes here</div>
                                <div>
                                    <h4>{mo.label}</h4>
                                    <p>{mo.blurb}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <>
                    <div className={styles.mainContent}>
                        <div
                            className={styles.orderTypeDropdownContainer}
                            id='tutorial-order-type'
                        >
                            <OrderDropdown
                                options={marketOrderTypes}
                                value={marketOrderType}
                                onChange={handleMarketOrderTypeChange}
                            />
                            <button
                                onClick={() => openModalWithContent('margin')}
                                className={styles.isolatedButton}
                            >
                                Isolated <FiChevronDown size={24} />
                            </button>
                            <button className={styles.trade_type_toggle}>
                                <PiSquaresFour
                                    onClick={() => setShowLaunchpad(true)}
                                />
                            </button>
                        </div>

                        <LeverageSlider {...leverageSliderProps} />

                        <div className={styles.inputDetailsDataContainer}>
                            {inputDetailsData.map((data, idx) => (
                                <div
                                    key={idx}
                                    className={styles.inputDetailsDataContent}
                                >
                                    <div className={styles.inputDetailsLabel}>
                                        <span>{data.label}</span>
                                        <Tooltip
                                            content={data?.tooltipLabel}
                                            position='right'
                                        >
                                            <AiOutlineQuestionCircle
                                                size={13}
                                            />
                                        </Tooltip>
                                    </div>
                                    <span className={styles.inputDetailValue}>
                                        {data.value}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {marketOrderType === 'chase_limit' && (
                            <ChasePrice {...chasePriceProps} />
                        )}

                        {showStopPriceComponent && (
                            <StopPrice {...stopPriceProps} />
                        )}
                        {showPriceInputComponent && (
                            <PriceInput {...priceInputProps} />
                        )}
                        <SizeInput {...sizeInputProps} />
                        <PositionSize {...positionSizeProps} />

                        {showPriceRangeComponent && (
                            <PriceRange {...priceRangeProps} />
                        )}
                        {marketOrderType === 'scale' &&
                            priceDistributionButtons}
                        {marketOrderType === 'twap' && <RunningTime />}

                        <ReduceAndProfitToggle
                            {...reduceAndProfitToggleProps}
                        />
                    </div>
                    <PlaceOrderButtons
                        orderMarketPrice={marketOrderType}
                        openModalWithContent={openModalWithContent}
                        orderValue={orderValue}
                        leverage={leverage}
                    />
                    {appSettingsModal.isOpen && (
                        <Modal
                            close={appSettingsModal.close}
                            title={
                                modalContent === 'margin'
                                    ? 'Margin Mode'
                                    : modalContent === 'scale'
                                      ? 'Scale Options'
                                      : modalContent === 'confirm_buy'
                                        ? 'Confirm Buy Order'
                                        : modalContent === 'confirm_sell'
                                          ? 'Confirm Sell Order'
                                          : ''
                            }
                        >
                            {modalContent === 'margin' && (
                                <MarginModal
                                    handleMarginModeChange={
                                        handleMarginModeChange
                                    }
                                    handleMarginModeConfirm={
                                        handleMarginModeConfirm
                                    }
                                    activeMargin={activeMargin}
                                />
                            )}

                            {modalContent === 'scale' && (
                                <ScaleOrders
                                    totalQuantity={parseFloat(
                                        priceRangeTotalOrders,
                                    )}
                                    minPrice={parseFloat(priceRangeMin)}
                                    maxPrice={parseFloat(priceRangeMax)}
                                    isModal
                                    onClose={appSettingsModal.close}
                                />
                            )}
                            {modalContent === 'confirm_buy' && (
                                <ConfirmationModal
                                    tx='buy'
                                    onClose={() => {
                                        notifications.add({
                                            title: 'Buy / Long Order Pending',
                                            message:
                                                'Buying 0.0001 ETH at $2,300',
                                            icon: 'spinner',
                                        });
                                        appSettingsModal.close();
                                    }}
                                />
                            )}
                            {modalContent === 'confirm_sell' && (
                                <ConfirmationModal
                                    tx='sell'
                                    onClose={() => {
                                        notifications.add({
                                            title: 'Sell / Short Order Pending',
                                            message:
                                                'Selling 0.0001 ETH at $2,300',
                                            icon: 'spinner',
                                        });
                                        appSettingsModal.close();
                                    }}
                                />
                            )}
                        </Modal>
                    )}
                </>
            )}
        </div>
    );
}
