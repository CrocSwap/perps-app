import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import { FiChevronDown } from 'react-icons/fi';
import { GoZap } from 'react-icons/go';
import { LuOctagonX } from 'react-icons/lu';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { PiArrowLineDown, PiSquaresFour } from 'react-icons/pi';
import { RiBarChartHorizontalLine } from 'react-icons/ri';
import { TbArrowBigUpLine, TbClockPlus } from 'react-icons/tb';
import Modal from '~/components/Modal/Modal';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useKeydown } from '~/hooks/useKeydown';
import { useModal } from '~/hooks/useModal';
import useNumFormatter from '~/hooks/useNumFormatter';
import {
    useNotificationStore,
    type NotificationStoreIF,
} from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
import { parseNum } from '~/utils/orderbook/OrderBookUtils';
import evenSvg from '../../../assets/icons/EvenPriceDistribution.svg';
import flatSvg from '../../../assets/icons/FlatPriceDistribution.svg';
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
import { useAppOptions, type useAppOptionsIF } from '~/stores/AppOptionsStore';
export interface OrderTypeOption {
    value: string;
    label: string;
    blurb: string;
    icon: JSX.Element;
}

export interface ChaseOption {
    value: string;
    label: string;
}

export type MarginMode = 'cross' | 'isolated' | null;

const marketOrderTypes = [
    {
        value: 'market',
        label: 'Market',
        blurb: 'Buy/sell at the current price',
        icon: <GoZap color={'var(--accent1)'} size={25} />,
    },
    {
        value: 'limit',
        label: 'Limit',
        blurb: 'Buy/Sell at a specific price or better',
        icon: <PiArrowLineDown color={'var(--accent1)'} size={25} />,
    },
    {
        value: 'stop_market',
        label: 'Stop Market',
        blurb: 'Triggers a market order at a set price',
        icon: <LuOctagonX color={'var(--accent1)'} size={25} />,
    },
    {
        value: 'stop_limit',
        label: 'Stop Limit',
        blurb: 'Triggers a limit order at a set price',
        icon: <LuOctagonX color={'var(--accent1)'} size={25} />,
    },
    {
        value: 'twap',
        label: 'TWAP',
        blurb: 'Distributes trades across a specified time period',
        icon: <TbClockPlus color={'var(--accent1)'} size={25} />,
    },
    {
        value: 'scale',
        label: 'Scale',
        blurb: 'Multiple orders at incrementing prices',
        icon: <RiBarChartHorizontalLine color={'var(--accent1)'} size={25} />,
    },
    {
        value: 'chase_limit',
        label: 'Chase Limit',
        blurb: 'Adjusts limit price to follow the market',
        icon: <TbArrowBigUpLine color={'var(--accent1)'} size={25} />,
    },
];

// disabled code 07 Jul 25
// const chaseOptionTypes = [
//     { value: 'bid1ask1', label: 'Bid1/Ask1' },
//     { value: 'distancebidask1', label: 'Distance from Bid1/Ask1' },
// ];

const leverageOptions = [
    { value: 1, label: '1x' },
    { value: 5, label: '5x' },
    { value: 10, label: '10x' },
    { value: 50, label: '50x' },
    { value: 100, label: '100x' },
];

// keys for content that may be rendered in tx modal
export type modalContentT =
    | 'margin'
    | 'scale'
    | 'market_buy'
    | 'market_sell'
    | 'limit_buy'
    | 'limit_sell';

function OrderInput() {
    const [marketOrderType, setMarketOrderType] = useState<string>('market');
    const [activeMargin, setActiveMargin] = useState<MarginMode>('isolated');

    const [leverage, setLeverage] = useState(100);
    const [size, setSize] = useState('');
    const [price, setPrice] = useState('');
    const [stopPrice, setStopPrice] = useState('');
    const [positionSize, setPositionSize] = useState(0);
    // disabled 07 Jul 25
    // const [chaseOption, setChaseOption] = useState<string>('bid1ask1');
    const [isReduceOnlyEnabled, setIsReduceOnlyEnabled] = useState(false);
    const [isTakeProfitEnabled, setIsTakeProfitEnabled] = useState(false);
    const [isRandomizeEnabled, setIsRandomizeEnabled] = useState(false);
    const [isChasingIntervalEnabled, setIsChasingIntervalEnabled] =
        useState(false);
    const [priceRangeMin, setPriceRangeMin] = useState('86437.7');
    const [priceRangeMax, setPriceRangeMax] = useState('90000');
    const [priceRangeTotalOrders, setPriceRangeTotalOrders] = useState('2');

    const minimumInputValue = 1;
    const [tempMaximumLeverageInput, setTempMaximumLeverageInput] =
        useState<number>(100);
    const generateRandomMaximumInput = () => {
        // Generate a random maximum between minimumInputValue and 100
        const newMaximumInputValue =
            Math.floor(Math.random() * (100 - minimumInputValue + 1)) +
            minimumInputValue;

        setTempMaximumLeverageInput(newMaximumInputValue);
    };

    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('symbol');

    const { obChosenPrice, obChosenAmount, symbol, symbolInfo } =
        useTradeDataStore();
    const { parseFormattedNum, formatNumWithOnlyDecimals } = useNumFormatter();

    const confirmOrderModal = useModal<modalContentT>('closed');

    const showPriceInputComponent = ['limit', 'stop_limit'].includes(
        marketOrderType,
    );

    const showPriceRangeComponent = marketOrderType === 'scale';

    const showStopPriceComponent = ['stop_limit', 'stop_market'].includes(
        marketOrderType,
    );

    const useTotalSize = ['twap', 'chase_limit'].includes(marketOrderType);

    const inputDetailsData = useMemo(
        () => [
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
        ],
        [],
    );

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

    const activeOptions: useAppOptionsIF = useAppOptions();

    const handleMarketOrderTypeChange = useCallback((value: string) => {
        setMarketOrderType(value);
    }, []);
    const handleMarginModeChange = useCallback((mode: MarginMode) => {
        setActiveMargin(mode);
    }, []);

    const handleMarginModeConfirm = () => {
        if (activeMargin) {
            console.log(`Confirmed: ${activeMargin} margin mode`);
        }
        confirmOrderModal.close();
    };
    const handleLeverageChange = (value: number) => {
        setLeverage(value);
    };

    const handleSizeChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement> | string) => {
            if (typeof event === 'string') {
                setSize(event);
            } else {
                setSize(event.target.value);
            }
        },
        [],
    );

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
    // code disabled 07 Jul 25
    // const handleChaseOptionChange = (value: string) => {
    //     setChaseOption(value);
    //     console.log(`Chase Option changed to: ${value}`);
    // };

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

    const priceDistributionButtons = useMemo(
        () => (
            <div className={styles.priceDistributionContainer}>
                <div className={styles.priceDistributionContainer}>
                    <div className={styles.inputDetailsLabel}>
                        <span>Price Distribution</span>
                        <Tooltip
                            content={'price distribution'}
                            position='right'
                        >
                            <AiOutlineQuestionCircle size={13} />
                        </Tooltip>
                    </div>
                    <div className={styles.actionButtonsContainer}>
                        <button onClick={() => confirmOrderModal.open('scale')}>
                            <img src={flatSvg} alt='flat price distribution' />
                            Flat
                        </button>
                        <button onClick={() => confirmOrderModal.open('scale')}>
                            <img src={evenSvg} alt='even price distribution' />
                            Evenly Split
                        </button>
                    </div>
                </div>
            </div>
        ),
        [styles.priceDistributionContainer],
    );

    // -----------------------------PROPS----------------------------------------
    const reduceAndProfitToggleProps = useMemo(
        () => ({
            isReduceOnlyEnabled,
            isTakeProfitEnabled,
            handleToggleProfitOnly,
            handleToggleReduceOnly,
            marketOrderType,
            isRandomizeEnabled,
            handleToggleRandomize,
            isChasingIntervalEnabled,
            handleToggleIsChasingInterval: handleToggleChasingInterval,
        }),
        [
            isReduceOnlyEnabled,
            isTakeProfitEnabled,
            handleToggleProfitOnly,
            handleToggleReduceOnly,
            marketOrderType,
            isRandomizeEnabled,
            handleToggleRandomize,
            isChasingIntervalEnabled,
            handleToggleChasingInterval,
        ],
    );

    const leverageSliderProps = useMemo(
        () => ({
            options: leverageOptions,
            value: leverage,
            onChange: handleLeverageChange,
            minimumInputValue: minimumInputValue,
            maximumInputValue: tempMaximumLeverageInput,
            generateRandomMaximumInput: generateRandomMaximumInput,
        }),
        [leverage, handleLeverageChange],
    );

    // const chasePriceProps = useMemo(
    //     () => ({
    //         chaseOption,
    //         chaseOptionTypes,
    //         handleChaseOptionChange,
    //     }),
    //     [chaseOption, handleChaseOptionChange],
    // );

    const stopPriceProps = useMemo(
        () => ({
            value: stopPrice,
            onChange: handleStopPriceChange,
            onBlur: handleStopPriceBlur,
            onKeyDown: handleStopPriceKeyDown,
            className: 'custom-input',
            ariaLabel: 'stop price input',
        }),
        [stopPrice, handleStopPriceChange],
    );

    const priceInputProps = useMemo(
        () => ({
            value: price,
            onChange: handlePriceChange,
            onBlur: handlePriceBlur,
            onKeyDown: handlePriceKeyDown,
            className: 'custom-input',
            ariaLabel: 'Price input',
            showMidButton: ['stop_limit', 'limit'].includes(marketOrderType),
        }),
        [price, handlePriceChange],
    );

    const sizeInputProps = useMemo(
        () => ({
            value: size,
            onChange: handleSizeChange,
            onBlur: handleSizeBlur,
            onKeyDown: handleSizeKeyDown,
            className: 'custom-input',
            ariaLabel: 'Size input',
            symbol,
            selectedMode,
            setSelectedMode,
            useTotalSize,
        }),
        [size, handleSizeChange, useTotalSize],
    );

    const positionSizeProps = useMemo(
        () => ({
            step: 5,
            value: positionSize,
            onChange: handlePositionSizeChange,
        }),
        [positionSize, handlePositionSizeChange],
    );

    const priceRangeProps = useMemo(
        () => ({
            minValue: priceRangeMin,
            maxValue: priceRangeMax,
            handleChangeMin: handleMinPriceRange,
            handleChangeMax: handleMaxPriceRange,
            handleChangetotalOrders: handleTotalordersPriceRange,
            totalOrders: priceRangeTotalOrders,
        }),
        [
            priceRangeMin,
            priceRangeMax,
            handleMinPriceRange,
            handleMaxPriceRange,
            handleTotalordersPriceRange,
            priceRangeTotalOrders,
        ],
    );

    // logic to dispatch a notification on demand
    const notifications: NotificationStoreIF = useNotificationStore();

    // bool to handle toggle of order type launchpad mode
    const [showLaunchpad, setShowLaunchpad] = useState<boolean>(false);

    // hook to bind action to close launchpad to the DOM
    useKeydown('Escape', () => setShowLaunchpad(false));

    return (
        <div className={styles.mainContainer}>
            {showLaunchpad ? (
                <div className={styles.launchpad}>
                    <header>
                        <div
                            className={styles.exit_launchpad}
                            onClick={() => setShowLaunchpad(false)}
                        >
                            <MdKeyboardArrowLeft />
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
                                <div className={styles.name_and_icon}>
                                    {mo.icon}
                                    <h4>{mo.label}</h4>
                                </div>
                                <div>
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
                                onClick={() => confirmOrderModal.open('margin')}
                                className={styles.isolatedButton}
                            >
                                Isolated <FiChevronDown size={24} />
                            </button>
                            <button
                                className={styles.trade_type_toggle}
                                onClick={() => setShowLaunchpad(true)}
                            >
                                <PiSquaresFour />
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

                        {/* {marketOrderType === 'chase_limit' && (
                            <ChasePrice {...chasePriceProps} / predu>
                        )} */}

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
                        isLimit={marketOrderType === 'limit'}
                        orderMarketPrice={marketOrderType}
                        openModalWithContent={(c: modalContentT) =>
                            confirmOrderModal.open(c)
                        }
                        orderValue={orderValue}
                        leverage={leverage}
                    />
                    {confirmOrderModal.isOpen && (
                        <Modal
                            close={confirmOrderModal.close}
                            title={
                                confirmOrderModal.content === 'margin'
                                    ? 'Margin Mode'
                                    : confirmOrderModal.content === 'scale'
                                      ? 'Scale Options'
                                      : confirmOrderModal.content ===
                                          'market_buy'
                                        ? 'Confirm Buy Order'
                                        : confirmOrderModal.content ===
                                            'market_sell'
                                          ? 'Confirm Sell Order'
                                          : confirmOrderModal.content ===
                                              'limit_buy'
                                            ? 'Confirm Limit Buy'
                                            : confirmOrderModal.content ===
                                                'limit_sell'
                                              ? 'Confirm Limit Sale'
                                              : ''
                            }
                        >
                            {confirmOrderModal.content === 'margin' && (
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

                            {confirmOrderModal.content === 'scale' && (
                                <ScaleOrders
                                    totalQuantity={parseFloat(
                                        priceRangeTotalOrders,
                                    )}
                                    minPrice={parseFloat(priceRangeMin)}
                                    maxPrice={parseFloat(priceRangeMax)}
                                    isModal
                                    onClose={confirmOrderModal.close}
                                />
                            )}
                            {confirmOrderModal.content === 'market_buy' && (
                                <ConfirmationModal
                                    tx='market_buy'
                                    size={{
                                        qty: size,
                                        denom: 'BTC',
                                    }}
                                    isEnabled={
                                        !activeOptions.skipOpenOrderConfirm
                                    }
                                    toggleEnabled={() =>
                                        activeOptions.toggle(
                                            'skipOpenOrderConfirm',
                                        )
                                    }
                                    onClose={() => {
                                        notifications.add({
                                            title: 'Buy / Long Market Order Pending',
                                            message:
                                                'Buying 0.0001 ETH at $2,300',
                                            icon: 'spinner',
                                        });
                                        confirmOrderModal.close();
                                    }}
                                />
                            )}
                            {confirmOrderModal.content === 'market_sell' && (
                                <ConfirmationModal
                                    tx='market_sell'
                                    size={{
                                        qty: size,
                                        denom: 'BTC',
                                    }}
                                    onClose={() => {
                                        notifications.add({
                                            title: 'Sell / Short Market Order Pending',
                                            message:
                                                'Selling 0.0001 ETH at $2,300',
                                            icon: 'spinner',
                                        });
                                        confirmOrderModal.close();
                                    }}
                                    toggleEnabled={() =>
                                        activeOptions.toggle(
                                            'skipClosePositionConfirm',
                                        )
                                    }
                                    isEnabled={
                                        !activeOptions.skipClosePositionConfirm
                                    }
                                />
                            )}
                            {confirmOrderModal.content === 'limit_buy' && (
                                <ConfirmationModal
                                    tx='limit_buy'
                                    size={{
                                        qty: size,
                                        denom: 'BTC',
                                    }}
                                    limitPrice={price}
                                    onClose={() => {
                                        notifications.add({
                                            title: 'Buy / Long Limit Order Pending',
                                            message:
                                                'Buying 0.0001 ETH at $2,300',
                                            icon: 'spinner',
                                        });
                                        confirmOrderModal.close();
                                    }}
                                    toggleEnabled={() =>
                                        activeOptions.toggle(
                                            'skipOpenOrderConfirm',
                                        )
                                    }
                                    isEnabled={
                                        !activeOptions.skipClosePositionConfirm
                                    }
                                />
                            )}
                            {confirmOrderModal.content === 'limit_sell' && (
                                <ConfirmationModal
                                    tx='limit_sell'
                                    size={{
                                        qty: size,
                                        denom: 'BTC',
                                    }}
                                    limitPrice={price}
                                    onClose={() => {
                                        notifications.add({
                                            title: 'Sell / Short Limit Order Pending',
                                            message:
                                                'Selling 0.0001 ETH at $2,300',
                                            icon: 'spinner',
                                        });
                                        confirmOrderModal.close();
                                    }}
                                    toggleEnabled={() =>
                                        activeOptions.toggle(
                                            'skipClosePositionConfirm',
                                        )
                                    }
                                    isEnabled={
                                        !activeOptions.skipClosePositionConfirm
                                    }
                                />
                            )}
                        </Modal>
                    )}
                </>
            )}
        </div>
    );
}

export default React.memo(OrderInput);
