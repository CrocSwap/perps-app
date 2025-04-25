import { useEffect, useMemo, useState } from 'react';
import styles from './OrderInput.module.css';
import OrderDropdown from './OrderDropdown/OrderDropdown';
import LeverageSlider from './LeverageSlider/LeverageSlider';
import Tooltip from '~/components/Tooltip/Tooltip';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import SizeInput from './SizeInput/SizeInput';
import PriceInput from './PriceInput/PriceInput';
import StopPrice from './StopPrice/StopPrice';
import PositionSize from './PositionSIze/PositionSize';
import ReduceAndProfitToggle from './ReduceAndProfitToggle/ReduceAndProfitToggle';
import ChasePrice from './ChasePrice/ChasePrice';
import PlaceOrderButtons from './PlaceOrderButtons/PlaceOrderButtons';
import PriceRange from './PriceRange/PriceRange';
import RunningTime from './RunningTime/RunningTime';
import { useModal, type useModalIF } from '~/hooks/useModal';
import Modal from '~/components/Modal/Modal';
import MarginModal from './MarginModal/MarginModal';
import { FiChevronDown } from 'react-icons/fi';
import ScaleOrders from './ScaleOrders/ScaleOrders';
import evenSvg from '../../../assets/icons/EvenPriceDistribution.svg';
import flatSvg from '../../../assets/icons/FlatPriceDistribution.svg';
import ConfirmationModal from './ConfirmationModal/ConfirmationModal';
import {
    useNotificationStore,
    type NotificationStoreIF,
} from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import useNumFormatter from '~/hooks/useNumFormatter';
import { parseNum } from '~/utils/orderbook/OrderBookUtils';
export interface OrderTypeOption {
    value: string;
    label: string;
}

export type MarginMode = 'cross' | 'isolated' | null;

const marketOrderTypes: OrderTypeOption[] = [
    { value: 'market', label: 'Market' },
    { value: 'limit', label: 'Limit' },
    { value: 'scale', label: 'Scale' },
    { value: 'stop_limit', label: 'Stop Limit' },
    { value: 'stop_market', label: 'Stop Market' },
    { value: 'twap', label: 'TWAP' },
    { value: 'chase_limit', label: 'Chase Limit' },
];

const chaseOptionTypes: OrderTypeOption[] = [
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
    const {
        formatNum,
        parseFormattedNum,
        formatNumWithOnlyDecimals,
        parseFormattedWithOnlyDecimals,
    } = useNumFormatter();

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

    return (
        <div className={styles.mainContainer}>
            <div className={styles.mainContent}>
                <div className={styles.orderTypeDropdownContainer}>
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
                                    <AiOutlineQuestionCircle size={13} />
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

                {showStopPriceComponent && <StopPrice {...stopPriceProps} />}
                {showPriceInputComponent && <PriceInput {...priceInputProps} />}
                <SizeInput {...sizeInputProps} />
                <PositionSize {...positionSizeProps} />

                {showPriceRangeComponent && <PriceRange {...priceRangeProps} />}
                {marketOrderType === 'scale' && priceDistributionButtons}
                {marketOrderType === 'twap' && <RunningTime />}

                <ReduceAndProfitToggle {...reduceAndProfitToggleProps} />
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
                            handleMarginModeChange={handleMarginModeChange}
                            handleMarginModeConfirm={handleMarginModeConfirm}
                            activeMargin={activeMargin}
                        />
                    )}

                    {modalContent === 'scale' && (
                        <ScaleOrders
                            totalQuantity={parseFloat(priceRangeTotalOrders)}
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
                                notifications.add('buyPending');
                                appSettingsModal.close();
                            }}
                        />
                    )}
                    {modalContent === 'confirm_sell' && (
                        <ConfirmationModal
                            tx='sell'
                            onClose={() => {
                                notifications.add('sellPending');
                                appSettingsModal.close();
                            }}
                        />
                    )}
                </Modal>
            )}
        </div>
    );
}
