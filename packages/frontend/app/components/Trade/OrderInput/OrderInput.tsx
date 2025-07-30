import { type MarginBucketInfo } from '@crocswap-libs/ambient-ember';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState,
    type JSX,
} from 'react';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import { GoZap } from 'react-icons/go';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { PiSquaresFour } from 'react-icons/pi';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useKeydown } from '~/hooks/useKeydown';
import { useMarketOrderService } from '~/hooks/useMarketOrderService';
import { useModal } from '~/hooks/useModal';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppOptions, type useAppOptionsIF } from '~/stores/AppOptionsStore';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useLeverageStore } from '~/stores/LeverageStore';
import {
    useNotificationStore,
    type NotificationStoreIF,
} from '~/stores/NotificationStore';
import { useTradeDataStore, type marginModesT } from '~/stores/TradeDataStore';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
import { parseNum } from '~/utils/orderbook/OrderBookUtils';
import evenSvg from '../../../assets/icons/EvenPriceDistribution.svg';
import flatSvg from '../../../assets/icons/FlatPriceDistribution.svg';
import ConfirmationModal from './ConfirmationModal/ConfirmationModal';
import LeverageSlider from './LeverageSlider/LeverageSlider';
import MarginModal from './MarginModal/MarginModal';
import OrderDetails from './OrderDetails/OrderDetails';
import OrderDropdown from './OrderDropdown/OrderDropdown';
import styles from './OrderInput.module.css';
import PositionSize from './PositionSIze/PositionSize';
import PriceInput from './PriceInput/PriceInput';
import PriceRange from './PriceRange/PriceRange';
import RunningTime from './RunningTime/RunningTime';
import ScaleOrders from './ScaleOrders/ScaleOrders';
import SizeInput from './SizeInput/SizeInput';
import StopPrice from './StopPrice/StopPrice';
import TradeDirection from './TradeDirection/TradeDirection';
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
export type OrderSide = 'buy' | 'sell';

export type MarginMode = 'error' | 'isolated' | null;

const marketOrderTypes = [
    {
        value: 'market',
        label: 'Market',
        blurb: 'Buy/sell at the current price',
        icon: <GoZap color={'var(--accent1)'} size={25} />,
    },
    // {
    //     value: 'limit',
    //     label: 'Limit',
    //     blurb: 'Buy/Sell at a specific price or better',
    //     icon: <PiArrowLineDown color={'var(--accent1)'} size={25} />,
    // },
    // disabled code 21 Jul 25
    // {
    //     value: 'stop_market',
    //     label: 'Stop Market',
    //     blurb: 'Triggers a market order at a set price',
    //     icon: <LuOctagonX color={'var(--accent1)'} size={25} />,
    // },
    // {
    //     value: 'stop_limit',
    //     label: 'Stop Limit',
    //     blurb: 'Triggers a limit order at a set price',
    //     icon: <LuOctagonX color={'var(--accent1)'} size={25} />,
    // },
    // {
    //     value: 'twap',
    //     label: 'TWAP',
    //     blurb: 'Distributes trades across a specified time period',
    //     icon: <TbClockPlus color={'var(--accent1)'} size={25} />,
    // },
    // {
    //     value: 'scale',
    //     label: 'Scale',
    //     blurb: 'Multiple orders at incrementing prices',
    //     icon: <RiBarChartHorizontalLine color={'var(--accent1)'} size={25} />,
    // },
    // {
    //     value: 'chase_limit',
    //     label: 'Chase Limit',
    //     blurb: 'Adjusts limit price to follow the market',
    //     icon: <TbArrowBigUpLine color={'var(--accent1)'} size={25} />,
    // },
];

// disabled code 07 Jul 25
// const chaseOptionTypes = [
//     { value: 'bid1ask1', label: 'Bid1/Ask1' },
//     { value: 'distancebidask1', label: 'Distance from Bid1/Ask1' },
// ];

// keys for content that may be rendered in tx modal
export type modalContentT =
    | 'margin'
    | 'scale'
    | 'market_buy'
    | 'market_sell'
    | 'limit_buy'
    | 'limit_sell';

function OrderInput({
    marginBucket,
}: {
    marginBucket: MarginBucketInfo | null;
}) {
    const { getBsColor } = useAppSettings();

    const sessionState = useSession();

    const buyColor = getBsColor().buy;
    const sellColor = getBsColor().sell;
    const [marketOrderType, setMarketOrderType] = useState<string>('market');
    const [tradeDirection, setTradeDirection] = useState<OrderSide>('buy');

    const isUserLoggedIn = useMemo(() => {
        return isEstablished(sessionState);
    }, [sessionState]);

    // Market order service hook
    const { executeMarketOrder, isLoading: isMarketOrderLoading } =
        useMarketOrderService();

    const [leverage, setLeverage] = useState(1);

    const [price, setPrice] = useState('');

    const [stopPrice, setStopPrice] = useState('');

    const [positionSliderPercentageValue, setPositionSliderPercentageValue] =
        useState(0);

    const [notionalSymbolQtyNum, setNotionalSymbolQtyNum] = useState(0);

    // Track if we're processing an order
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    useEffect(() => {
        console.log({ notionalSymbolQtyNum });
    }, [notionalSymbolQtyNum]);

    const [sizeDisplay, setSizeDisplay] = useState('');

    const isPriceInvalid = useMemo(() => {
        return (
            marketOrderType === 'limit' &&
            (price === '' || price === '0' || price === '0.0')
        );
    }, [price, marketOrderType]);

    // disabled 07 Jul 25
    // const [chaseOption, setChaseOption] = useState<string>('bid1ask1');
    // const [isReduceOnlyEnabled, setIsReduceOnlyEnabled] = useState(false);
    // const [isTakeProfitEnabled, setIsTakeProfitEnabled] = useState(false);
    // const [isRandomizeEnabled, setIsRandomizeEnabled] = useState(false);
    // const [isChasingIntervalEnabled, setIsChasingIntervalEnabled] =
    //     useState(false);
    const [priceRangeMin, setPriceRangeMin] = useState('86437.7');
    const [priceRangeMax, setPriceRangeMax] = useState('90000');
    const [priceRangeTotalOrders, setPriceRangeTotalOrders] = useState('2');

    const minNotionalUsdOrderSize = 0.99;
    // eslint-disable-next-line
    const [tempMaximumLeverageInput, setTempMaximumLeverageInput] =
        useState<number>(100);
    const generateRandomMaximumInput = () => {
        // Generate a random maximum between minNotionalUsdOrderSize and 100
        const newMaximumInputValue =
            Math.floor(Math.random() * (100 - minNotionalUsdOrderSize + 1)) +
            minNotionalUsdOrderSize;

        setTempMaximumLeverageInput(newMaximumInputValue);
    };

    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('usd');

    const {
        obChosenPrice,
        obChosenAmount,
        symbol,
        symbolInfo,
        marginMode,
        setMarginMode,
    } = useTradeDataStore();

    const markPx = symbolInfo?.markPx;

    const {
        parseFormattedNum,
        formatNumWithOnlyDecimals,
        activeGroupSeparator,
        formatNum,
    } = useNumFormatter();

    const confirmOrderModal = useModal<modalContentT>('closed');

    const showPriceInputComponent = ['limit', 'stop_limit'].includes(
        marketOrderType,
    );

    const showPriceRangeComponent = marketOrderType === 'scale';

    const showStopPriceComponent = ['stop_limit', 'stop_market'].includes(
        marketOrderType,
    );

    const useTotalSize = ['twap', 'chase_limit'].includes(marketOrderType);

    const { validateAndApplyLeverageForMarket } = useLeverageStore();

    const [userExceededAvailableMargin, setUserExceededAvailableMargin] =
        useState(false);

    const [usdAvailableToTrade, setUsdAvailableToTrade] = useState(0);

    const [currentPositionNotionalSize, setCurrentPositionNotionalSize] =
        useState(0);

    const [isEditingSizeInput, setIsEditingSizeInput] = useState(false);

    useEffect(() => {
        const usdAvailableToTrade =
            marginBucket?.calculations?.collateralAvailableToWithdraw || 0;
        const normalizedAvailableToTrade =
            Number(usdAvailableToTrade) / 1_000_000;
        setUsdAvailableToTrade(normalizedAvailableToTrade);

        const currentPositionNotionalSize = marginBucket?.netPosition || 0;
        const normalizedCurrentPosition =
            Number(currentPositionNotionalSize) / 100_000_000;
        setCurrentPositionNotionalSize(normalizedCurrentPosition);
    }, [marginBucket]);

    function roundDownToMillionth(value: number) {
        return Math.floor(value * 1_000_000) / 1_000_000;
    }

    const notionalUsdOrderSizeNum =
        Math.floor(notionalSymbolQtyNum * (markPx || 1) * 100) / 100;

    useEffect(() => {
        if (
            positionSliderPercentageValue === 100 &&
            markPx &&
            !isEditingSizeInput &&
            !userExceededAvailableMargin
        ) {
            setNotionalSymbolQtyNum((usdAvailableToTrade / markPx) * leverage);
        }
    }, [
        positionSliderPercentageValue,
        usdAvailableToTrade,
        leverage,
        markPx,
        isEditingSizeInput,
        userExceededAvailableMargin,
    ]);

    const sizeLessThanMinimum =
        !notionalUsdOrderSizeNum ||
        notionalUsdOrderSizeNum < minNotionalUsdOrderSize;

    const displayNumAvailableToTrade = useMemo(() => {
        return formatNum(usdAvailableToTrade, 2);
    }, [usdAvailableToTrade, activeGroupSeparator]);

    const displayNumCurrentPosition = useMemo(() => {
        return formatNum(
            currentPositionNotionalSize,
            6,
            false,
            false,
            false,
            false,
            10000,
            true,
        );
    }, [currentPositionNotionalSize, activeGroupSeparator]);

    const inputDetailsData = useMemo(
        () => [
            {
                label: 'Available to Trade',
                tooltipLabel: 'Deposited fUSD',
                value: displayNumAvailableToTrade,
            },
            {
                label: 'Current Position',
                tooltipLabel: `Current ${symbol} position size`,
                value: `${displayNumCurrentPosition} ${symbol}`,
            },
        ],
        [displayNumAvailableToTrade, displayNumCurrentPosition, symbol],
    );

    const usdOrderValue = useMemo(() => {
        let orderValue = 0;
        if (marketOrderType === 'market' || marketOrderType === 'stop_market') {
            orderValue = notionalSymbolQtyNum * (markPx || 1);
        } else if (
            (marketOrderType === 'limit' || marketOrderType === 'stop_limit') &&
            price &&
            price.length > 0 &&
            notionalSymbolQtyNum
        ) {
            orderValue = notionalSymbolQtyNum * parseFormattedNum(price);
        }
        return orderValue;
    }, [
        notionalSymbolQtyNum,
        price,
        marketOrderType,
        markPx,
        parseNum,
        parseFormattedNum,
    ]);

    const marginRequired = useMemo(() => {
        return usdOrderValue / leverage;
    }, [usdOrderValue, leverage]);

    const collateralInsufficient =
        roundDownToMillionth(usdAvailableToTrade) <
        roundDownToMillionth(marginRequired);

    useEffect(() => {
        setNotionalSymbolQtyNum(0);
        setPrice('');

        // Apply leverage validation when symbol changes
        // BUT only if we have the correct symbolInfo for the current symbol
        if (
            symbol &&
            symbolInfo?.maxLeverage &&
            symbolInfo?.symbol === symbol
        ) {
            const validatedLeverage = validateAndApplyLeverageForMarket(
                symbol,
                symbolInfo.maxLeverage,
                minNotionalUsdOrderSize,
            );
            setLeverage(validatedLeverage);
        } else if (
            symbol &&
            symbolInfo?.maxLeverage &&
            symbolInfo?.symbol &&
            symbolInfo.symbol !== symbol
        ) {
            console.log(
                `OrderInput: Symbol mismatch - waiting for correct symbolInfo. Current: ${symbol}, symbolInfo: ${symbolInfo?.symbol}`,
            );
        }
    }, [
        symbol,
        symbolInfo?.maxLeverage,
        symbolInfo?.symbol,
        validateAndApplyLeverageForMarket,
    ]);

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

    const handleLeverageChange = (value: number) => {
        setLeverage(value);
    };

    // 1. Keep sizeDisplay constant and update notionalSymbolQtyNum when markPx changes (and not in 'symbol' mode)
    useEffect(() => {
        if (
            !isEditingSizeInput &&
            selectedMode !== 'symbol' &&
            sizeDisplay &&
            markPx
        ) {
            const parsedQty = parseFormattedNum(sizeDisplay);
            if (!isNaN(parsedQty) && markPx !== 0) {
                setNotionalSymbolQtyNum(parsedQty / markPx);
            }
        }
        // Only depend on markPx here
    }, [markPx]);

    useEffect(() => {
        if (
            !isEditingSizeInput &&
            selectedMode === 'usd' &&
            sizeDisplay &&
            markPx
        ) {
            const parsedQty = parseFormattedNum(sizeDisplay);
            if (!isNaN(parsedQty) && markPx !== 0) {
                setSizeDisplay(
                    formatNumWithOnlyDecimals(parsedQty * markPx, 2),
                );
            }
        }
        // Only depend on selectedMode here
    }, [selectedMode]);

    // 2. Update sizeDisplay when notionalSymbolQtyNum or selectedMode changes
    useEffect(() => {
        if (!isEditingSizeInput) {
            if (selectedMode === 'symbol' && notionalSymbolQtyNum) {
                setSizeDisplay(
                    notionalSymbolQtyNum
                        ? formatNumWithOnlyDecimals(
                              notionalSymbolQtyNum,
                              6,
                              true,
                          )
                        : '',
                );
            } else if (notionalSymbolQtyNum && markPx) {
                setSizeDisplay(
                    notionalSymbolQtyNum
                        ? formatNumWithOnlyDecimals(
                              notionalSymbolQtyNum * markPx,
                              2,
                              true,
                          )
                        : '',
                );
            }
        }
    }, [
        notionalSymbolQtyNum,
        selectedMode,
        isEditingSizeInput,
        markPx,
        leverage,
    ]);

    useEffect(() => {
        const percent = Math.min(
            (((notionalSymbolQtyNum / leverage) * (markPx || 1)) /
                usdAvailableToTrade) *
                100,
            100,
        );
        console.log({ percent });
        setPositionSliderPercentageValue(percent);
    }, [leverage]);

    const handleOnFocus = () => {
        setIsEditingSizeInput(true);
    };

    const handleSizeChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement> | string) => {
            if (typeof event === 'string') {
                setSizeDisplay(event);
            } else {
                setSizeDisplay(event.target.value);
            }
        },
        [],
    );

    const handleSizeInputBlur = useCallback(() => {
        setIsEditingSizeInput(false);
        const parsed = parseFormattedNum(sizeDisplay.trim());
        if (!isNaN(parsed)) {
            const adjusted =
                selectedMode === 'symbol' ? parsed : parsed / (markPx || 1);
            setNotionalSymbolQtyNum(adjusted);
            if (isUserLoggedIn) {
                const usdValue = adjusted * (markPx || 1);
                const percent =
                    (usdValue / leverage / usdAvailableToTrade) * 100;
                if (percent > 100) {
                    setUserExceededAvailableMargin(true);
                    setPositionSliderPercentageValue(100);
                } else {
                    setUserExceededAvailableMargin(false);
                    setPositionSliderPercentageValue(percent);
                }
            }
        } else if (sizeDisplay.trim() === '') {
            setNotionalSymbolQtyNum(0);
        }
    }, [
        usdAvailableToTrade,
        markPx,
        sizeDisplay,
        selectedMode,
        isUserLoggedIn,
    ]);

    const handleSizeKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'Enter') {
            console.log('Enter pressed:', sizeDisplay);
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

    const setNotionalSymbolQtyNumFromUsdAvailableToTrade = (value: number) => {
        if (marketOrderType === 'market') {
            const notionalSymbolQtyNum =
                (((value / 100) * usdAvailableToTrade) / (markPx || 1)) *
                leverage;
            setNotionalSymbolQtyNum(notionalSymbolQtyNum);
        } else if (marketOrderType === 'limit') {
            setNotionalSymbolQtyNum(
                Math.floor(
                    (((value / 100) * usdAvailableToTrade) /
                        (parseFormattedNum(price) || 1)) *
                        leverage *
                        100,
                ) / 100,
            );
        }
    };

    // POSITION SIZE------------------------------
    const handleSizeSliderChange = (value: number) => {
        setIsEditingSizeInput(false);

        setPositionSliderPercentageValue(value);
        setNotionalSymbolQtyNumFromUsdAvailableToTrade(value);
    };

    useEffect(() => {
        setNotionalSymbolQtyNumFromUsdAvailableToTrade(
            positionSliderPercentageValue,
        );
    }, [usdAvailableToTrade]);

    // CHASE OPTION---------------------------------------------------
    // code disabled 07 Jul 25
    // const handleChaseOptionChange = (value: string) => {
    //     setChaseOption(value);
    //     console.log(`Chase Option changed to: ${value}`);
    // };

    // REDUCE AND PROFIT STOP LOSS -----------------------------------------------------

    // const handleToggleReduceOnly = (newState?: boolean) => {
    //     const newValue =
    //         newState !== undefined ? newState : !isReduceOnlyEnabled;
    //     setIsReduceOnlyEnabled(newValue);
    // };
    // const handleToggleProfitOnly = (newState?: boolean) => {
    //     const newValue =
    //         newState !== undefined ? newState : !isTakeProfitEnabled;
    //     setIsTakeProfitEnabled(newValue);
    // };
    // const handleToggleRandomize = (newState?: boolean) => {
    //     const newValue =
    //         newState !== undefined ? newState : !isRandomizeEnabled;
    //     setIsRandomizeEnabled(newValue);
    // };
    // const handleToggleChasingInterval = (newState?: boolean) => {
    //     const newValue =
    //         newState !== undefined ? newState : !isChasingIntervalEnabled;
    //     setIsChasingIntervalEnabled(newValue);
    // };

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
    // const reduceAndProfitToggleProps = useMemo(
    //     () => ({
    //         isReduceOnlyEnabled,
    //         isTakeProfitEnabled,
    //         handleToggleProfitOnly,
    //         handleToggleReduceOnly,
    //         marketOrderType,
    //         isRandomizeEnabled,
    //         handleToggleRandomize,
    //         isChasingIntervalEnabled,
    //         handleToggleIsChasingInterval: handleToggleChasingInterval,
    //     }),
    //     [
    //         isReduceOnlyEnabled,
    //         isTakeProfitEnabled,
    //         handleToggleProfitOnly,
    //         handleToggleReduceOnly,
    //         marketOrderType,
    //         isRandomizeEnabled,
    //         handleToggleRandomize,
    //         isChasingIntervalEnabled,
    //         handleToggleChasingInterval,
    //     ],
    // );

    const leverageSliderProps = useMemo(
        () => ({
            value: leverage,
            onChange: handleLeverageChange,
            minNotionalUsdOrderSize: minNotionalUsdOrderSize,
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
            showMidButton: ['stop_limit'].includes(marketOrderType),
        }),
        [price, handlePriceChange],
    );

    const sizeInputProps = useMemo(
        () => ({
            value: sizeDisplay,
            onChange: handleSizeChange,
            onFocus: handleOnFocus,
            onBlur: handleSizeInputBlur,
            onUnfocus: () => setIsEditingSizeInput(false),
            onKeyDown: handleSizeKeyDown,
            className: 'custom-input',
            ariaLabel: 'Size input',
            symbol,
            selectedMode,
            setSelectedMode,
            useTotalSize,
        }),
        [
            handleSizeChange,
            handleSizeInputBlur,
            handleSizeKeyDown,
            selectedMode,
            symbol,
            useTotalSize,
            sizeDisplay,
        ],
    );

    const positionSliderPercentageValueProps = useMemo(
        () => ({
            step: 5,
            value: positionSliderPercentageValue,
            onChange: handleSizeSliderChange,
        }),
        [positionSliderPercentageValue, handleSizeSliderChange],
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

    // fn to submit a 'Buy' market order
    async function submitMarketBuy(): Promise<void> {
        // Validate position size
        if (!notionalSymbolQtyNum || notionalSymbolQtyNum <= 0) {
            notifications.add({
                title: 'Invalid Order Size',
                message: 'Please enter a valid order size',
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        try {
            setIsProcessingOrder(true);
            // Execute the market buy order
            const result = await executeMarketOrder({
                quantity: notionalSymbolQtyNum,
                side: 'buy',
            });

            if (result.success) {
                // Show success notification
                notifications.add({
                    title: 'Buy Order Successful',
                    message: `Successfully bought ${notionalSymbolQtyNum.toFixed(6)} ${symbol}`,
                    icon: 'check',
                });
                // Reset position size after successful order
                setNotionalSymbolQtyNum(0);
                setPositionSliderPercentageValue(0);
                setSizeDisplay('');
            } else {
                // Show error notification
                notifications.add({
                    title: 'Buy Order Failed',
                    message: result.error || 'Transaction failed',
                    icon: 'error',
                });
            }
        } catch (error) {
            console.error('❌ Error submitting market buy order:', error);
            notifications.add({
                title: 'Buy Order Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
            });
        } finally {
            setIsProcessingOrder(false);
            confirmOrderModal.close();
        }
    }

    // fn to submit a 'Sell' market order
    async function submitMarketSell(): Promise<void> {
        // Validate position size
        if (!notionalSymbolQtyNum || notionalSymbolQtyNum <= 0) {
            notifications.add({
                title: 'Invalid Order Size',
                message: 'Please enter a valid order size',
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        try {
            setIsProcessingOrder(true);
            // Execute the market sell order
            const result = await executeMarketOrder({
                quantity: notionalSymbolQtyNum,
                side: 'sell',
            });

            if (result.success) {
                // Show success notification
                notifications.add({
                    title: 'Sell Order Successful',
                    message: `Successfully sold ${notionalSymbolQtyNum.toFixed(6)} ${symbol}`,
                    icon: 'check',
                });
                // Reset position size after successful order
                setNotionalSymbolQtyNum(0);
                setPositionSliderPercentageValue(0);
                setSizeDisplay('');
            } else {
                // Show error notification
                notifications.add({
                    title: 'Sell Order Failed',
                    message: result.error || 'Transaction failed',
                    icon: 'error',
                });
            }
        } catch (error) {
            console.error('❌ Error submitting market sell order:', error);
            notifications.add({
                title: 'Sell Order Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
            });
        } finally {
            setIsProcessingOrder(false);
            confirmOrderModal.close();
        }
    }

    // fn to submit a 'Buy' limit order
    function submitLimitBuy(): void {
        notifications.add({
            title: 'Buy / Long Limit Order Pending',
            message: 'Buying 0.0001 ETH at $2,300',
            icon: 'spinner',
        });
        confirmOrderModal.close();
    }

    // fn to submit a 'Sell' limit order
    function submitLimitSell(): void {
        notifications.add({
            title: 'Sell / Short Limit Order Pending',
            message: 'Selling 0.0001 ETH at $2,300',
            icon: 'spinner',
        });
        confirmOrderModal.close();
    }

    // logic to dispatch a notification on demand
    const notifications: NotificationStoreIF = useNotificationStore();

    // bool to handle toggle of order type launchpad mode
    const [showLaunchpad, setShowLaunchpad] = useState<boolean>(false);

    // hook to bind action to close launchpad to the DOM
    useKeydown('Escape', () => setShowLaunchpad(false));

    const formattedSizeDisplay = formatNum(
        parseFormattedNum(sizeDisplay),
        selectedMode === 'symbol' ? 6 : 2,
    );

    const handleSubmitOrder = () => {
        if (tradeDirection === 'buy') {
            if (marketOrderType === 'market') {
                if (activeOptions.skipOpenOrderConfirm) {
                    submitMarketBuy();
                } else {
                    confirmOrderModal.open('market_buy');
                }
            } else if (marketOrderType === 'limit') {
                if (activeOptions.skipOpenOrderConfirm) {
                    submitLimitBuy();
                } else {
                    confirmOrderModal.open('limit_buy');
                }
            }
        } else {
            if (marketOrderType === 'market') {
                if (activeOptions.skipOpenOrderConfirm) {
                    submitMarketSell();
                } else {
                    confirmOrderModal.open('market_sell');
                }
            } else if (marketOrderType === 'limit') {
                if (activeOptions.skipOpenOrderConfirm) {
                    submitLimitSell();
                } else {
                    confirmOrderModal.open('limit_sell');
                }
            }
        }
    };
    const getDisabledReason = (
        collateralInsufficient: boolean,
        sizeLessThanMinimum: boolean,
        isPriceInvalid: boolean,
        isMarketOrderLoading: boolean,
    ) => {
        if (isMarketOrderLoading) return 'Processing order...';
        if (collateralInsufficient) return 'Insufficient collateral';
        if (sizeLessThanMinimum) return 'Order size below minimum';
        if (isPriceInvalid) return 'Invalid price';
        return null;
    };
    const isDisabled =
        collateralInsufficient ||
        sizeLessThanMinimum ||
        isPriceInvalid ||
        isMarketOrderLoading;
    const disabledReason = getDisabledReason(
        collateralInsufficient,
        sizeLessThanMinimum,
        isPriceInvalid,
        isMarketOrderLoading,
    );

    const launchPadContent = (
        <div className={styles.launchpad}>
            <header>
                <div
                    className={styles.exit_launchpad}
                    onClick={() => setShowLaunchpad(false)}
                >
                    <MdKeyboardArrowLeft />
                </div>
                <h3>Order Types</h3>
                <button
                    className={styles.trade_type_toggle}
                    onClick={() => setShowLaunchpad(false)}
                >
                    <PiSquaresFour />
                </button>
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
    );

    return (
        <div className={styles.mainContainer}>
            {showLaunchpad ? (
                launchPadContent
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
                            <SimpleButton
                                className={styles.margin_type_btn}
                                onClick={() => confirmOrderModal.open('margin')}
                                bg='dark3'
                                hoverBg='accent1'
                            >
                                {marginMode}
                            </SimpleButton>
                            <button
                                className={styles.trade_type_toggle}
                                onClick={() => setShowLaunchpad(true)}
                            >
                                <PiSquaresFour />
                            </button>
                        </div>
                        <TradeDirection
                            tradeDirection={tradeDirection}
                            setTradeDirection={setTradeDirection}
                        />

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
                        <PositionSize {...positionSliderPercentageValueProps} />

                        {showPriceRangeComponent && (
                            <PriceRange {...priceRangeProps} />
                        )}
                        {marketOrderType === 'scale' &&
                            priceDistributionButtons}
                        {marketOrderType === 'twap' && <RunningTime />}

                        {/* <ReduceAndProfitToggle
                            {...reduceAndProfitToggleProps}
                        /> */}
                    </div>
                    <div className={styles.button_details_container}>
                        {isUserLoggedIn && (
                            <Tooltip
                                content={disabledReason}
                                position='top'
                                disabled={!isDisabled}
                            >
                                <button
                                    className={styles.submit_button}
                                    style={{
                                        backgroundColor:
                                            tradeDirection === 'buy'
                                                ? buyColor
                                                : sellColor,
                                    }}
                                    onClick={handleSubmitOrder}
                                    disabled={isDisabled}
                                >
                                    Submit
                                </button>
                            </Tooltip>
                        )}
                        <OrderDetails
                            orderMarketPrice={marketOrderType}
                            usdOrderValue={usdOrderValue}
                            marginRequired={marginRequired}
                        />
                    </div>
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
                                    initial={marginMode}
                                    handleConfirm={(m: marginModesT) => {
                                        setMarginMode(m);
                                        confirmOrderModal.close();
                                    }}
                                />
                            )}
                            {confirmOrderModal.content === 'scale' && (
                                <ScaleOrders
                                    totalQuantity={parseFormattedNum(
                                        priceRangeTotalOrders,
                                    )}
                                    minPrice={parseFormattedNum(priceRangeMin)}
                                    maxPrice={parseFormattedNum(priceRangeMax)}
                                    isModal
                                    onClose={confirmOrderModal.close}
                                />
                            )}
                            {confirmOrderModal.content === 'market_buy' && (
                                <ConfirmationModal
                                    tx='market_buy'
                                    size={{
                                        qty: formattedSizeDisplay,
                                        denom:
                                            selectedMode === 'symbol'
                                                ? symbolInfo?.coin || ''
                                                : 'USD',
                                    }}
                                    isEnabled={
                                        !activeOptions.skipOpenOrderConfirm
                                    }
                                    toggleEnabled={() =>
                                        activeOptions.toggle(
                                            'skipOpenOrderConfirm',
                                        )
                                    }
                                    submitFn={submitMarketBuy}
                                    isProcessing={isProcessingOrder}
                                />
                            )}
                            {confirmOrderModal.content === 'market_sell' && (
                                <ConfirmationModal
                                    tx='market_sell'
                                    size={{
                                        qty: formattedSizeDisplay,
                                        denom:
                                            selectedMode === 'symbol'
                                                ? symbolInfo?.coin || ''
                                                : 'USD',
                                    }}
                                    submitFn={submitMarketSell}
                                    toggleEnabled={() =>
                                        activeOptions.toggle(
                                            'skipOpenOrderConfirm',
                                        )
                                    }
                                    isEnabled={
                                        !activeOptions.skipOpenOrderConfirm
                                    }
                                    isProcessing={isProcessingOrder}
                                />
                            )}
                            {confirmOrderModal.content === 'limit_buy' && (
                                <ConfirmationModal
                                    tx='limit_buy'
                                    size={{
                                        qty: formattedSizeDisplay,
                                        denom:
                                            selectedMode === 'symbol'
                                                ? symbolInfo?.coin || ''
                                                : 'USD',
                                    }}
                                    limitPrice={price}
                                    submitFn={submitLimitBuy}
                                    toggleEnabled={() =>
                                        activeOptions.toggle(
                                            'skipOpenOrderConfirm',
                                        )
                                    }
                                    isEnabled={
                                        !activeOptions.skipOpenOrderConfirm
                                    }
                                />
                            )}
                            {confirmOrderModal.content === 'limit_sell' && (
                                <ConfirmationModal
                                    tx='limit_sell'
                                    size={{
                                        qty: formattedSizeDisplay,
                                        denom:
                                            selectedMode === 'symbol'
                                                ? symbolInfo?.coin || ''
                                                : 'USD',
                                    }}
                                    limitPrice={price}
                                    submitFn={submitLimitSell}
                                    toggleEnabled={() =>
                                        activeOptions.toggle(
                                            'skipOpenOrderConfirm',
                                        )
                                    }
                                    isEnabled={
                                        !activeOptions.skipOpenOrderConfirm
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

export default memo(OrderInput);
