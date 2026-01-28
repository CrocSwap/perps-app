import {
    calcLeverageFloor,
    calcLiqPriceOnNewOrder,
    calcMarginAvail,
    maxRemainingUserNotionalOI,
    type MarginBucketAvail,
} from '@crocswap-libs/ambient-ember';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { GoZap } from 'react-icons/go';
import { LuCircleHelp } from 'react-icons/lu';
import { PiArrowLineDown, PiSquaresFour } from 'react-icons/pi';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useKeydown } from '~/hooks/useKeydown';
import { useLimitOrderService } from '~/hooks/useLimitOrderService';
import { useMarketOrderService } from '~/hooks/useMarketOrderService';
import { useModal } from '~/hooks/useModal';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppOptions, type useAppOptionsIF } from '~/stores/AppOptionsStore';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useDebugStore } from '~/stores/DebugStore';
import { useLeverageStore } from '~/stores/LeverageStore';
import {
    makeSlug,
    useNotificationStore,
    type NotificationStoreIF,
} from '~/stores/NotificationStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { usePythPrice } from '~/stores/PythPriceStore';
import { useTradeDataStore, type marginModesT } from '~/stores/TradeDataStore';
import {
    BTC_MAX_LEVERAGE,
    MIN_ORDER_VALUE,
    MIN_POSITION_USD_SIZE,
    getTxLink,
} from '~/utils/Constants';
import {
    getDurationSegment,
    getLeverageSegment,
    getSizePercentageSegment,
} from '~/utils/functions/getSegment';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
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
import ReduceAndProfitToggle from './ReduceAndProfitToggle/ReduceAndProfitToggle';
import RunningTime from './RunningTime/RunningTime';
import ScaleOrders from './ScaleOrders/ScaleOrders';
import SizeInput from './SizeInput/SizeInput';
import StopPrice from './StopPrice/StopPrice';
import TradeDirection from './TradeDirection/TradeDirection';
import type {
    modalContentT,
    OrderInputChangeType,
    OrderSide,
    OrderTypeOption,
} from '~/utils/CommonIFs';
import { useTranslation } from 'react-i18next';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { useMobile } from '~/hooks/useMediaQuery';
import { triggerPulseAnimation } from '~/utils/orderbook/OrderBookUtils';

const useOnlyMarket = false;

// disabled code 07 Jul 25
// const chaseOptionTypes = [
//     { value: 'bid1ask1', label: 'Bid1/Ask1' },
//     { value: 'distancebidask1', label: 'Distance from Bid1/Ask1' },
// ];

// Custom hook for debouncing boolean values (only debounces true values)
function useDebounceOnTrue(value: boolean, delay: number): boolean {
    const [debouncedValue, setDebouncedValue] = useState<boolean>(value);

    useEffect(() => {
        // Only set the debounced value if value is true
        if (value) {
            const timer = setTimeout(() => {
                setDebouncedValue(true);
            }, delay);
            return () => clearTimeout(timer);
        } else {
            setDebouncedValue(false);
            return () => {};
        }
    }, [value, delay]);

    return debouncedValue;
}

function OrderInput({
    marginBucket,
    isAnyPortfolioModalOpen,
}: {
    marginBucket: MarginBucketAvail | null;
    isAnyPortfolioModalOpen: boolean;
}) {
    const {
        t,
        i18n: { language },
    } = useTranslation();
    const marketOrderTypes = useOnlyMarket
        ? [
              {
                  value: 'market',
                  label: t('transactions.market'),
                  blurb: t('transactions.buySellAtCurrentPrice'),
                  icon: <GoZap color={'var(--accent1)'} size={25} />,
              },
          ]
        : [
              {
                  value: 'market',
                  label: t('transactions.market'),
                  blurb: t('transactions.buySellAtCurrentPrice'),
                  icon: <GoZap color={'var(--accent1)'} size={25} />,
              },
              {
                  value: 'limit',
                  label: t('transactions.limit'),
                  blurb: t('transactions.buySellAtSpecificPrice'),
                  icon: <PiArrowLineDown color={'var(--accent1)'} size={25} />,
              },
              // disabled code 21 Jul 25
              //   {
              //       value: 'stop_market',
              //       label: 'Stop Market',
              //       blurb: 'Triggers a market order at a set price',
              //       icon: <LuOctagonX color={'var(--accent1)'} size={25} />,
              //   },
              //   {
              //       value: 'stop_limit',
              //       label: 'Stop Limit',
              //       blurb: 'Triggers a limit order at a set price',
              //       icon: <LuOctagonX color={'var(--accent1)'} size={25} />,
              //   },
              //   {
              //       value: 'twap',
              //       label: 'TWAP',
              //       blurb: 'Distributes trades across a specified time period',
              //       icon: <TbClockPlus color={'var(--accent1)'} size={25} />,
              //   },
              //   {
              //       value: 'scale',
              //       label: 'Scale',
              //       blurb: 'Multiple orders at incrementing prices',
              //       icon: (
              //           <RiBarChartHorizontalLine
              //               color={'var(--accent1)'}
              //               size={25}
              //           />
              //       ),
              //   },
              //   {
              //       value: 'chase_limit',
              //       label: 'Chase Limit',
              //       blurb: 'Adjusts limit price to follow the market',
              //       icon: <TbArrowBigUpLine color={'var(--accent1)'} size={25} />,
              //   },
          ];

    // Track if the OrderInput component is focused
    const [isFocused, setIsFocused] = useState(false);
    const orderInputRef = useRef<HTMLDivElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement | null>(null);
    const { getBsColor } = useAppSettings();

    const sessionState = useSession();
    const activeOptions: useAppOptionsIF = useAppOptions();

    const {
        obChosenPrice,
        setObChosenPrice,
        symbol,
        symbolInfo,
        marginMode,
        setMarginMode,
        setOrderInputPriceValue,
        orderInputPriceValue,
        orderInputSizeValue,
        tradeDirection,
        setTradeDirection,
        setIsMidModeActive,
        isMidModeActive,
        marketOrderType,
        setMarketOrderType,
    } = useTradeDataStore();

    const orderInputPriceValueRef = useRef<number | undefined>(undefined);
    orderInputPriceValueRef.current = orderInputPriceValue.value;

    // Track if direction change came from debounced price input (to prevent auto-focus)
    const directionChangeFromInputRef = useRef(false);

    // Debounce timer ref for price input changes
    const priceInputDebounceRef = useRef<NodeJS.Timeout | null>(null);

    const isMobileRef = useRef(false);
    const isMobile = useMobile();
    isMobileRef.current = isMobile;

    const buyColor = getBsColor().buy;
    const sellColor = getBsColor().sell;
    const marketOrderTypeRef = useRef(marketOrderType);
    marketOrderTypeRef.current = marketOrderType;

    const [shouldUpdateAfterTrade, setShouldUpdateAfterTrade] = useState(false);

    const isUserLoggedIn = useMemo(() => {
        return isEstablished(sessionState);
    }, [sessionState]);

    // Market order service hook
    const { executeMarketOrder, isLoading: isMarketOrderLoading } =
        useMarketOrderService();

    const { executeLimitOrder } = useLimitOrderService();

    // Get the current leverage from the store and subscribe to changes
    const leverage = useLeverageStore((state) => state.currentLeverage);
    const setLeverage = useLeverageStore((state) => state.setPreferredLeverage);

    const [price, setPrice] = useState('');

    const [stopPrice, setStopPrice] = useState('');

    const [sizePercentageValue, setSizePercentageValue] = useState(0);

    const [notionalQtyNum, setNotionalQtyNum] = useState(0);

    // Track if we're processing an order
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    const [sizeDisplay, setSizeDisplay] = useState('');

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

    const [maxRemainingOI, setMaxRemainingOI] = useState<number>(100_000);

    const OI_BUFFER = 0.9995;

    const [isSizeSetAsPercentage, setIsSizeSetAsPercentage] = useState(false);

    const isMidModeActiveRef = useRef(isMidModeActive);
    isMidModeActiveRef.current = isMidModeActive;

    const isPriceInvalid = useMemo(() => {
        return (
            marketOrderType === 'limit' &&
            (price === '' || price === '0' || price === '0.0')
        );
    }, [price, marketOrderType]);

    useEffect(() => {
        if (!marginBucket) return;
        const maxRemainingOI = maxRemainingUserNotionalOI(
            marginBucket,
            tradeDirection === 'buy',
        );
        const unscaledMaxRemainingOI = Number(maxRemainingOI) / 1e6;
        setMaxRemainingOI(unscaledMaxRemainingOI * OI_BUFFER);
    }, [marginBucket, tradeDirection]);

    const [selectedDenom, setSelectedDenom] = useState<OrderBookMode>('usd');

    const { buys, sells, midPrice, usualResolution } = useOrderBookStore();
    const midPriceRef = useRef(midPrice);
    midPriceRef.current = midPrice;
    const { useMockLeverage, mockMinimumLeverage } = useDebugStore();

    // backup mark price for when symbolInfo not available
    // Get Pyth price for the current symbol
    const pythPriceData = usePythPrice(symbol);
    const markPx = symbolInfo?.markPx || pythPriceData?.price;

    const {
        parseFormattedNum,
        formatNumWithOnlyDecimals,
        activeGroupSeparator,
        formatNum,
    } = useNumFormatter();

    const getMidPrice = () => {
        if (!buys.length || !sells.length) return null;
        const midPrice = (buys[0].px + sells[0].px) / 2;
        return midPrice;
    };

    const assignPrice = (price: string, changeType: OrderInputChangeType) => {
        // For inputChange, debounce the store update by 1000ms
        // This delays chart line updates and trade direction changes until user stops typing
        if (changeType === 'inputChange') {
            // Clear any pending debounce
            if (priceInputDebounceRef.current) {
                clearTimeout(priceInputDebounceRef.current);
            }
            // Update local price display immediately (handled by handlePriceChange setting price state)
            // But debounce the store update that triggers chart line and direction changes
            priceInputDebounceRef.current = setTimeout(() => {
                directionChangeFromInputRef.current = true;
                if (price && price.length > 0) {
                    const parsed = parseFormattedNum(price);
                    setOrderInputPriceValue({ value: parsed, changeType });
                } else {
                    setOrderInputPriceValue({ value: undefined, changeType });
                }
            }, 1000);
        } else {
            // For other change types (obClick, dragEnd, midPriceChange, reset), update immediately
            if (price && price.length > 0) {
                const parsed = parseFormattedNum(price);
                setOrderInputPriceValue({ value: parsed, changeType });
            } else {
                setOrderInputPriceValue({ value: undefined, changeType });
            }
        }
    };

    const setMidPriceAsPriceInput = () => {
        if (!midPriceRef.current) return;
        if (marketOrderType === 'limit') {
            const formattedMidPrice = formatNumWithOnlyDecimals(
                midPriceRef.current,
                6,
                true,
            );

            // setPrice(formattedMidPrice);
            assignPrice(formattedMidPrice, 'midPriceChange');
        }
    };

    const normalizedEquity = useMemo(() => {
        if (!marginBucket) return 0;
        return Number(marginBucket?.equity) / 1e6;
    }, [marginBucket]);

    const confirmOrderModal = useModal<modalContentT>('closed');

    useEffect(() => {
        // Don't update price if confirm modal is open
        if (isMidModeActive && !confirmOrderModal.isOpen) {
            setMidPriceAsPriceInput();
        }
    }, [
        isMidModeActive,
        marketOrderType,
        midPrice,
        confirmOrderModal.isOpen, // Add dependency to re-run when modal state changes
    ]);

    const showPriceInputComponent = ['limit', 'stop_limit'].includes(
        marketOrderType,
    );

    const showPriceRangeComponent = marketOrderType === 'scale';

    const showStopPriceComponent = ['stop_limit', 'stop_market'].includes(
        marketOrderType,
    );

    const useTotalSize = ['twap', 'chase_limit'].includes(marketOrderType);

    const { validateAndApplyLeverageForMarket } = useLeverageStore();

    const [leverageFloor, setLeverageFloor] = useState<number>();

    const [currentPositionNotionalSize, setCurrentPositionNotionalSize] =
        useState(0);

    const [isEditingSizeInput, setIsEditingSizeInput] = useState(false);

    const [liquidationPrice, setLiquidationPrice] = useState<number | null>(
        null,
    );

    const [isLeverageBeingDragged, setIsLeverageBeingDragged] =
        useState<boolean>(false);

    const maxActive = isSizeSetAsPercentage && sizePercentageValue === 100;

    useEffect(() => {
        if (!marginBucket) {
            setLeverageFloor(undefined);
            return;
        }
        try {
            const leverageFloor = calcLeverageFloor(marginBucket, 10_000_000n);
            const leverageFloorNum = Number(leverageFloor);
            if (!leverageFloorNum) return;
            const newLeverageFloor = 10_000 / leverageFloorNum;
            setLeverageFloor(Math.min(newLeverageFloor, BTC_MAX_LEVERAGE));
        } catch {
            setLeverageFloor(100);
        }
    }, [marginBucket, symbolInfo?.maxLeverage]);

    useEffect(() => {
        if (!marginBucket) {
            setCurrentPositionNotionalSize(0);
            return;
        }

        const currentPositionNotionalSize = marginBucket?.netPosition || 0;
        const normalizedCurrentPosition =
            Number(currentPositionNotionalSize) / 1e8;
        setCurrentPositionNotionalSize(normalizedCurrentPosition);
    }, [marginBucket?.netPosition, tradeDirection]);

    // Calculate liquidation price
    useEffect(() => {
        if (!marginBucket || !notionalQtyNum || notionalQtyNum === 0) {
            setLiquidationPrice(null);
            return;
        }

        // Get best bid or ask price based on trade direction
        let predictedEntryPrice: number | null = null;

        if (tradeDirection === 'buy' && sells.length > 0) {
            // For buy orders, use best ask (lowest sell price)
            predictedEntryPrice = sells[0].px;
        } else if (tradeDirection === 'sell' && buys.length > 0) {
            // For sell orders, use best bid (highest buy price)
            predictedEntryPrice = buys[0].px;
        }

        // If no orderbook data, fall back to mark price
        if (!predictedEntryPrice && markPx) {
            predictedEntryPrice = markPx;
        }

        if (!predictedEntryPrice) {
            setLiquidationPrice(null);
            return;
        }

        try {
            // Prepare inputs for calcLiqPriceOnNewOrder. calcLiqPrice function takes unscaled decimal values
            // *not* scaled fixed points. So adjust where needed.
            const collateral = Number(marginBucket.committedCollateral) / 1e6;

            const position = {
                qty: Number(marginBucket.netPosition) / 1e8,
                entryPrice: Number(marginBucket.avgEntryPrice) / 1e6,
            };

            // Order quantity: positive for buy, negative for sell
            // notionalQtyNum is already in human-readable format, need to scale to 10^8
            const orderQty =
                notionalQtyNum * (tradeDirection === 'buy' ? 1 : -1);

            const order = {
                qty: orderQty,
                entryPrice: predictedEntryPrice,
            };

            const mmBps = (marginBucket.marketMmBps || 50) / 10000;

            const liqPrice = calcLiqPriceOnNewOrder(
                collateral,
                position,
                order,
                mmBps,
            );

            // Rescale back to decimalized, because the display assumes the result is fixed point
            const normalizedLiqPrice = liqPrice ? liqPrice * 1e6 : null;

            setLiquidationPrice(normalizedLiqPrice);
        } catch (error) {
            console.error('Error calculating liquidation price:', error);
            setLiquidationPrice(null);
        }
    }, [marginBucket, notionalQtyNum, tradeDirection, buys, sells, markPx]);

    function roundDownToHundredth(value: number) {
        return Math.floor(value * 100) / 100;
    }
    function roundDownToTenth(value: number) {
        return Math.floor(value * 10) / 10;
    }

    const usdAvailableToTrade = useMemo(() => {
        if (!marginBucket) return 0;

        // Calculate implied maintenance margin from leverage
        const mmBps = Math.floor(10000 / leverage);
        const releveragedBucket = calcMarginAvail(marginBucket, mmBps);
        const normalizedAvailableToTrade =
            Number(
                tradeDirection === 'buy'
                    ? releveragedBucket?.availToBuy || 0
                    : releveragedBucket?.availToSell || 0,
            ) / 1_000_000;

        const roundedAvailableToTrade =
            normalizedAvailableToTrade < MIN_POSITION_USD_SIZE
                ? 0
                : normalizedAvailableToTrade;

        return roundedAvailableToTrade;
    }, [marginBucket, leverage, tradeDirection]);

    const maxOrderSizeWouldExceedRemainingOI = useMemo(() => {
        return usdAvailableToTrade * leverage > maxRemainingOI;
    }, [usdAvailableToTrade, leverage, maxRemainingOI]);

    const maxOrderSizeWouldExceedRemainingOIDebounced = useDebounceOnTrue(
        maxOrderSizeWouldExceedRemainingOI,
        500,
    );

    const getMaxTradeSizeInUsd = useCallback(
        (leverageParam: number) => {
            if (isReduceOnlyEnabled && marginBucket && markPx) {
                return Math.abs(currentPositionNotionalSize) * markPx;
            }

            const exceedsMax =
                usdAvailableToTrade * leverageParam > maxRemainingOI;

            if (exceedsMax) {
                return maxRemainingOI;
            } else {
                return usdAvailableToTrade * leverageParam;
            }
        },
        [
            usdAvailableToTrade,
            maxRemainingOI,
            isReduceOnlyEnabled,
            marginBucket,
            markPx,
            currentPositionNotionalSize,
        ],
    );

    const maxTradeSizeInUsd = useMemo(() => {
        return getMaxTradeSizeInUsd(leverage);
    }, [getMaxTradeSizeInUsd, leverage]);

    const usdOrderValue = useMemo(() => {
        let orderValue = 0;
        if (marketOrderType === 'market' || marketOrderType === 'stop_market') {
            orderValue = notionalQtyNum * (markPx || 1);
        } else if (
            (marketOrderType === 'limit' || marketOrderType === 'stop_limit') &&
            notionalQtyNum
        ) {
            orderValue = notionalQtyNum * (markPx || 1);
        }
        return orderValue;
    }, [notionalQtyNum, marketOrderType, markPx]);

    const marginRequired = useMemo(() => {
        return usdOrderValue / leverage;
    }, [usdOrderValue, leverage]);

    const isMarginInsufficient = useMemo(() => {
        return (
            !isReduceOnlyEnabled &&
            (usdAvailableToTrade < marginRequired * 0.99 ||
                (!maxTradeSizeInUsd && sizePercentageValue > 0))
        );
    }, [
        usdAvailableToTrade,
        marginRequired,
        sizePercentageValue,
        maxTradeSizeInUsd,
        isReduceOnlyEnabled,
    ]);

    const usdOrderSizeNum = useMemo(() => {
        return Math.floor(notionalQtyNum * (markPx || 1) * 100) / 100;
    }, [notionalQtyNum, markPx]);

    const sizeLessThanMinimum = useMemo(() => {
        return (
            !usdOrderSizeNum ||
            (usdOrderSizeNum < MIN_ORDER_VALUE * 0.99 &&
                !(isReduceOnlyEnabled && sizePercentageValue === 100))
        );
    }, [usdOrderSizeNum, isReduceOnlyEnabled, sizePercentageValue]);

    const sizeMoreThanMaximum = useMemo(() => {
        return usdOrderSizeNum > maxRemainingOI / OI_BUFFER;
    }, [usdOrderSizeNum, maxRemainingOI]);

    const currentPositionLessThanMinPositionSize = useMemo(() => {
        return (
            Math.abs(currentPositionNotionalSize) * (markPx || 1) <
            MIN_POSITION_USD_SIZE
        );
    }, [currentPositionNotionalSize, markPx]);

    const maxTradeSizeLessThanMinPositionSize = useMemo(() => {
        return maxTradeSizeInUsd < MIN_POSITION_USD_SIZE;
    }, [maxTradeSizeInUsd]);

    const displayNumAvailableToTrade = useMemo(() => {
        return maxTradeSizeLessThanMinPositionSize
            ? formatNum(0, 2, false, true)
            : formatNum(usdAvailableToTrade, 2, false, true);
    }, [
        usdAvailableToTrade,
        maxTradeSizeLessThanMinPositionSize,
        activeGroupSeparator,
    ]);

    const displayNumCurrentPosition = useMemo(() => {
        return currentPositionLessThanMinPositionSize
            ? formatNum(0, 2)
            : formatNum(
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

    const isMarginInsufficientDebounced = useDebounceOnTrue(
        isMarginInsufficient,
        500,
    );

    const isDepositRequired = useMemo(() => {
        return !isReduceOnlyEnabled && normalizedEquity < MIN_POSITION_USD_SIZE;
    }, [isReduceOnlyEnabled, normalizedEquity]);

    useEffect(() => {
        if (!isMobileRef.current) {
            setNotionalQtyNum(0);
            // setPrice('');
            assignPrice('', 'reset');
        }

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
                MIN_ORDER_VALUE,
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
        if (obChosenPrice > 0) {
            // timeout has been added to handle race condition useEffect [marketOrderType] on mobile
            setTimeout(() => {
                setIsMidModeActive(false);
                // setPrice(formatNumWithOnlyDecimals(obChosenPrice));
                assignPrice(
                    formatNumWithOnlyDecimals(obChosenPrice),
                    'obClick',
                );
                handleTypeChange();
                setObChosenPrice(0);
            }, 20);
        }
    }, [obChosenPrice]);

    const handleMarketOrderTypeChange = useCallback((value: string) => {
        setMarketOrderType(value);
    }, []);

    const handleLeverageChange = (value: number) => {
        setLeverage(Math.min(value, BTC_MAX_LEVERAGE));
        setIsEditingSizeInput(false);
    };

    useEffect(() => {
        const maxTradeSizeInUsd = getMaxTradeSizeInUsd(leverage);
        setSizeSliderPercentageFromLeverage(maxTradeSizeInUsd);
    }, [leverage]);

    // update sizeDisplay when selectedDenom between USD and Symbol
    useEffect(() => {
        if (!sizeDisplay) return;
        const parsedQty = parseFormattedNum(sizeDisplay);
        if (isNaN(parsedQty) || !markPx) return;
        if (selectedDenom === 'usd') {
            setSizeDisplay(formatNumWithOnlyDecimals(parsedQty * markPx, 2));
        } else {
            setSizeDisplay(
                formatNumWithOnlyDecimals(parsedQty / markPx, 6, true),
            );
        }
        // Only depend on selectedDenom here
    }, [selectedDenom]);

    // // update sizeDisplay when notionalQtyNum or selectedDenom changes
    useEffect(() => {
        if (isEditingSizeInput || !isSizeSetAsPercentage) return;
        if (selectedDenom === 'symbol') {
            setSizeDisplay(
                notionalQtyNum
                    ? formatNumWithOnlyDecimals(notionalQtyNum, 6, true)
                    : '',
            );
        } else if (markPx) {
            const newSizeString = notionalQtyNum
                ? formatNumWithOnlyDecimals(notionalQtyNum * markPx, 2, false)
                : '';
            setSizeDisplay(newSizeString);
        }
    }, [notionalQtyNum, selectedDenom, isEditingSizeInput]);

    const setSizeSliderPercentageFromLeverage = useCallback(
        (maxTradeSizeInUsd: number) => {
            if (!markPx) return;
            const percentage = Math.min(
                ((notionalQtyNum * markPx) / maxTradeSizeInUsd) * 100,
                100,
            );
            setSizePercentageValue(Math.max(percentage, 0));
            if (percentage === 100) {
                setIsSizeSetAsPercentage(true);
                setNotionalQtyNumFromPercentage(100);
            }
        },
        [markPx, maxTradeSizeInUsd, notionalQtyNum],
    );

    // update notionalQtyNum when mark price changes
    useEffect(() => {
        if (!markPx || isEditingSizeInput || isLeverageBeingDragged) return;
        let notionalQtyNum = 0;
        if (isSizeSetAsPercentage) {
            notionalQtyNum =
                ((maxTradeSizeInUsd / markPx) * sizePercentageValue) / 100;
        } else {
            if (selectedDenom === 'symbol') {
                notionalQtyNum = sizeDisplay
                    ? parseFormattedNum(sizeDisplay)
                    : 0;
            } else {
                notionalQtyNum = sizeDisplay
                    ? parseFormattedNum(sizeDisplay) / (markPx || 1)
                    : 0;
            }
        }
        const newNotionalQtyNum = Number(notionalQtyNum.toFixed(8));
        setNotionalQtyNum(Math.max(newNotionalQtyNum, 0));
        if (shouldUpdateAfterTrade) {
            setShouldUpdateAfterTrade(false);
        }
    }, [
        markPx,
        isLeverageBeingDragged,
        isReduceOnlyEnabled,
        shouldUpdateAfterTrade,
        maxTradeSizeInUsd,
    ]);

    const getCurrentPercentageOfMaxTradeSize = useCallback(() => {
        return ((notionalQtyNum * (markPx || 1)) / maxTradeSizeInUsd) * 100;
    }, [notionalQtyNum, markPx, maxTradeSizeInUsd]);

    // update size slider when specific size qty entered and reduce only toggled
    useEffect(() => {
        if (!maxTradeSizeInUsd || isSizeSetAsPercentage) return;
        setIsEditingSizeInput(false);
        const percent = Math.min(getCurrentPercentageOfMaxTradeSize(), 100);
        setSizePercentageValue(Math.max(percent, 0));
    }, [isReduceOnlyEnabled]);

    // update sizePercentageValue when notionalQtyNum changes
    useEffect(() => {
        if (!maxTradeSizeInUsd || isSizeSetAsPercentage) return;
        const percent = Math.min(getCurrentPercentageOfMaxTradeSize(), 100);
        setSizePercentageValue(Math.max(percent, 0));
    }, [notionalQtyNum]);

    const handleOnFocus = () => {
        setIsEditingSizeInput(true);
    };

    const handleSizeChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement> | string) => {
            setIsEditingSizeInput(true);
            setIsSizeSetAsPercentage(false);
            if (typeof event === 'string') {
                setSizeDisplay(event);
            } else {
                setSizeDisplay(event.target.value);
            }
        },
        [],
    );

    const updateNotionalQtyNumFromSizeDisplay = useCallback(() => {
        const parsed = parseFormattedNum(sizeDisplay.trim());
        if (!isNaN(parsed)) {
            const notionalSizeInputQty =
                selectedDenom === 'symbol' ? parsed : parsed / (markPx || 1);
            const newNotionalQtyNum = Number(notionalSizeInputQty.toFixed(8));
            setNotionalQtyNum(Math.max(newNotionalQtyNum, 0));
        } else if (sizeDisplay.trim() === '') {
            setNotionalQtyNum(0);
        }
    }, [sizeDisplay, selectedDenom, markPx]);

    // update slider on debounce after user has paused typing and updating sizeDisplay
    useEffect(() => {
        if (isEditingSizeInput) {
            if (sizeDisplay === '') {
                updateNotionalQtyNumFromSizeDisplay();
            } else {
                const timeout = setTimeout(() => {
                    updateNotionalQtyNumFromSizeDisplay();
                }, 500);
                return () => clearTimeout(timeout);
            }
        }
    }, [sizeDisplay, isEditingSizeInput]);

    const handleSizeInputBlur = useCallback(() => {
        setIsSizeSetAsPercentage(false);
        updateNotionalQtyNumFromSizeDisplay();
        setIsEditingSizeInput(false);
    }, [updateNotionalQtyNumFromSizeDisplay]);

    const handleSizeKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'Enter') {
            if (!isUserLoggedIn || isDisabled) return;
            if (activeOptions.skipOpenOrderConfirm) {
                submitButtonRef.current?.focus();
                event.preventDefault();
            } else {
                handleSubmitOrder();
            }
        }
    };
    // PRICE INPUT----------------------------------
    const handlePriceChange = (
        event: React.ChangeEvent<HTMLInputElement> | string,
    ) => {
        if (typeof event === 'string') {
            setPrice(event); // Update local display immediately
            assignPrice(event, 'inputChange'); // Debounced store update
        } else {
            setPrice(event.target.value); // Update local display immediately
            assignPrice(event.target.value, 'inputChange'); // Debounced store update
            setIsMidModeActive(false);
        }
    };

    useEffect(() => {
        if (marketOrderType === 'market') {
            setOrderInputPriceValue({ value: 0, changeType: 'inputChange' });
        } else if (
            marketOrderType === 'limit' &&
            !orderInputPriceValueRef.current
        ) {
            setIsMidModeActive(true);
        }
    }, [marketOrderType]);

    // set input price when orderInputPriceValue changes
    useEffect(() => {
        if (orderInputPriceValue.value === undefined) {
            setPrice('');
        } else if (orderInputPriceValue.value === 0) {
            setPrice('0');
        } else {
            const resVal = usualResolution?.val || 1;
            const decimals = Math.floor(Math.log10(resVal)) * -1;
            const priceToSet = formatNumWithOnlyDecimals(
                orderInputPriceValue.value,
                decimals > 0 ? decimals : 0,
                true,
            );
            setPrice(priceToSet);

            if (
                midPriceRef.current &&
                (orderInputPriceValue.changeType == 'dragEnd' ||
                    orderInputPriceValue.changeType == 'obClick')
            ) {
                if (orderInputPriceValue.value > midPriceRef.current) {
                    setTradeDirection('sell');
                } else {
                    setTradeDirection('buy');
                }
            }

            if (orderInputPriceValue.changeType === 'quickTradeMode') {
                triggerPulseAnimation(
                    'trade-module-price-input-container',
                    'divPulseNeon',
                    'pulsed-quick-trade',
                );
                triggerPulseAnimation(
                    'trade-module-size-input-container',
                    'divPulseNeon',
                    'pulsed-quick-trade',
                );
                return;
            }

            if (
                isMidModeActiveRef.current ||
                orderInputPriceValue.changeType !== 'dragEnd'
            )
                return;
            triggerPulseAnimation(
                'trade-module-price-input-container',
                'divPulseNeon',
                'pulsed',
            );
        }
    }, [orderInputPriceValue.value, usualResolution]);

    useEffect(() => {
        if (orderInputSizeValue.value > 0) {
            let convertedValue = orderInputSizeValue.value;

            // Convert if denominations don't match
            if (orderInputSizeValue.denom !== selectedDenom && markPx) {
                if (
                    orderInputSizeValue.denom === 'usd' &&
                    selectedDenom === 'symbol'
                ) {
                    // USD to Symbol: divide by markPx
                    convertedValue = orderInputSizeValue.value / markPx;
                } else if (
                    orderInputSizeValue.denom === 'symbol' &&
                    selectedDenom === 'usd'
                ) {
                    // Symbol to USD: multiply by markPx
                    convertedValue = orderInputSizeValue.value * markPx;
                }
            }

            setSizeDisplay(formatNumWithOnlyDecimals(convertedValue, 6, true));
            setIsEditingSizeInput(false);
        }
    }, [orderInputSizeValue, selectedDenom, markPx]);

    // Set direction when price input value changes (already debounced via assignPrice)
    useEffect(() => {
        if (
            !midPriceRef.current ||
            orderInputPriceValue.changeType !== 'inputChange'
        ) {
            return;
        }

        // Direction change happens immediately since assignPrice already debounced the store update
        if (
            orderInputPriceValue.value &&
            orderInputPriceValue.value > midPriceRef.current!
        ) {
            setTradeDirection('sell');
        } else {
            setTradeDirection('buy');
        }
    }, [orderInputPriceValue.value, orderInputPriceValue.changeType]);

    const handlePriceBlur = () => {
        console.log('Input lost focus');
    };

    const handlePriceKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'Enter') {
            if (!isUserLoggedIn || isDisabled) return;
            if (activeOptions.skipOpenOrderConfirm) {
                submitButtonRef.current?.focus();
                event.preventDefault();
            } else {
                handleSubmitOrder();
            }
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
            if (!isUserLoggedIn || isDisabled) return;
            if (activeOptions.skipOpenOrderConfirm) {
                submitButtonRef.current?.focus();
                event.preventDefault();
            } else {
                handleSubmitOrder();
            }
        }
    };

    const setNotionalQtyNumFromPercentage = useCallback(
        (value: number) => {
            if (!markPx) return;
            const notionalQtyNum =
                ((value / 100) * getMaxTradeSizeInUsd(leverage)) / markPx;
            const newNotionalQtyNum = Number(notionalQtyNum.toFixed(8));
            setNotionalQtyNum(Math.max(newNotionalQtyNum, 0));
        },
        [getMaxTradeSizeInUsd, markPx, leverage],
    );

    // POSITION SIZE------------------------------
    const handleSizeSliderChange = (value: number) => {
        setIsSizeSetAsPercentage(true);
        setSizePercentageValue(value);
        setIsEditingSizeInput(false);
    };

    useEffect(() => {
        if (isSizeSetAsPercentage && !isEditingSizeInput)
            setNotionalQtyNumFromPercentage(sizePercentageValue);
    }, [sizePercentageValue]);

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
                        <span>{t('transactions.priceDistribution')}</span>
                        <Tooltip
                            content={t('transactions.flatPriceDistribution')}
                            position='right'
                        >
                            <LuCircleHelp size={12} />
                        </Tooltip>
                    </div>
                    <div className={styles.actionButtonsContainer}>
                        <button onClick={() => confirmOrderModal.open('scale')}>
                            <img
                                src={flatSvg}
                                alt={t('transactions.flatPriceDistribution')}
                                aria-label={t('aria.flatPriceDistribution')}
                            />
                            {t('transactions.flat')}
                        </button>
                        <button onClick={() => confirmOrderModal.open('scale')}>
                            <img
                                src={evenSvg}
                                alt={t('transactions.evenPriceDistribution')}
                                aria-label={t('aria.evenPriceDistribution')}
                            />
                            {t('transactions.evenlySplit')}
                        </button>
                    </div>
                </div>
            </div>
        ),
        [
            styles.priceDistributionContainer,
            styles.inputDetailsLabel,
            styles.actionButtonsContainer,
            confirmOrderModal,
            t,
        ],
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
            value: leverage,
            onChange: handleLeverageChange,
            minNotionalUsdOrderSize: MIN_ORDER_VALUE,
            minimumValue: useMockLeverage ? mockMinimumLeverage : leverageFloor,
            isDragging: isLeverageBeingDragged,
            setIsDragging: setIsLeverageBeingDragged,
        }),
        [
            leverage,
            handleLeverageChange,
            leverageFloor,
            useMockLeverage,
            mockMinimumLeverage,
        ],
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
            ariaLabel: t('aria.stopPriceInput', 'Stop price input'),
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
            ariaLabel: t('aria.priceInput', 'Price input'),
            showMidButton: ['stop_limit', 'limit'].includes(marketOrderType),
            setMidPriceAsPriceInput,
            isMidModeActive,
            setIsMidModeActive,
        }),
        [
            price,
            handlePriceChange,
            marketOrderType,
            markPx,
            isMidModeActive,
            setIsMidModeActive,
            setMidPriceAsPriceInput,
        ],
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
            ariaLabel: t('aria.sizeInput', 'Size input'),
            symbol,
            isEditing: isEditingSizeInput,
            selectedDenom,
            setSelectedDenom,
            useTotalSize,
        }),
        [
            handleSizeChange,
            handleSizeInputBlur,
            handleSizeKeyDown,
            selectedDenom,
            symbol,
            useTotalSize,
            sizeDisplay,
            setSelectedDenom,
        ],
    );

    // After mount on client, focus the size input on desktop widths
    // Skip auto-focus when direction change came from debounced price input typing
    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined')
            return;
        if (window.innerWidth <= 768) return; // do not autofocus on mobile

        // Skip auto-focus if direction change came from debounced price input
        if (directionChangeFromInputRef.current) {
            directionChangeFromInputRef.current = false;
            return;
        }

        const el = document.getElementById(
            'trade-module-size-input',
        ) as HTMLInputElement | null;

        const timeoutId = setTimeout(() => {
            if (!notionalQtyNum) {
                el?.focus();
            }
        }, 700);

        return () => clearTimeout(timeoutId);
    }, [tradeDirection, marketOrderType]);

    const sizeSliderPercentageValueProps = useMemo(
        () => ({
            step: 5,
            value: sizePercentageValue,
            onChange: handleSizeSliderChange,
        }),
        [sizePercentageValue, handleSizeSliderChange],
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

    const isSubminimumClose = useMemo(
        () =>
            notionalQtyNum &&
            usdOrderSizeNum < MIN_ORDER_VALUE * 0.99 &&
            isReduceOnlyEnabled &&
            sizePercentageValue === 100,
        [
            notionalQtyNum,
            usdOrderSizeNum,
            isReduceOnlyEnabled,
            sizePercentageValue,
        ],
    );

    const subminimumCloseQty = useMemo(
        () => MIN_ORDER_VALUE / (markPx || 1),
        [markPx],
    );

    // logic to dispatch a notification on demand
    const notifications: NotificationStoreIF = useNotificationStore();

    // fn to submit a 'Buy' market order
    const submitMarketBuy = useCallback(async (): Promise<void> => {
        // Validate position size
        if (!notionalQtyNum || notionalQtyNum <= 0) {
            notifications.add({
                title: t('transactions.invalidOrderSize.title'),
                message: t('transactions.enterValidOrderSize'),
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        const slug = makeSlug(10);

        try {
            setIsProcessingOrder(true);
            // Get best ask price for buy order
            const bestAskPrice = sells.length > 0 ? sells[0].px : markPx;
            const usdValueOfOrderStr = formatNum(
                roundDownToHundredth(notionalQtyNum * (bestAskPrice || 1)),
                2,
                true,
                true,
            );
            if (activeOptions.skipOpenOrderConfirm) {
                confirmOrderModal.close();
                notifications.add({
                    title: t('transactions.buyOrderPending'),
                    message: t('transactions.orderSubmittedFor', {
                        usdValueOfOrderStr,
                        symbol,
                    }),
                    icon: 'spinner',
                    slug,
                    removeAfter: 60000,
                });
            }

            const timeOfTxBuildStart = Date.now();

            // Execute the market buy order
            const result = await executeMarketOrder({
                quantity: isSubminimumClose
                    ? subminimumCloseQty
                    : notionalQtyNum,
                side: 'buy',
                leverage: leverage,
                bestAskPrice: bestAskPrice,
                reduceOnly: isReduceOnlyEnabled,
            });

            if (result.success) {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Market Success',
                            direction: 'Buy',
                            orderType: 'Market',
                            maxActive: maxActive,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            success: true,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                            leverage: getLeverageSegment(leverage),
                            sizePercentage:
                                getSizePercentageSegment(sizePercentageValue),
                        },
                    });
                }
                // Show success notification
                notifications.add({
                    title: t('transactions.buyOrderSuccessful'),
                    message: t('transactions.successfullyBought', {
                        usdValueOfOrderStr,
                        symbol,
                    }),
                    icon: 'check',
                    removeAfter: 5000,
                    txLink: getTxLink(result.signature),
                });
                setShouldUpdateAfterTrade(true);
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Market Fail',
                            direction: 'Buy',
                            orderType: 'Market',
                            maxActive: maxActive,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            errorMessage: result.error || 'Transaction failed',
                            success: false,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                            leverage: getLeverageSegment(leverage),
                            sizePercentage:
                                getSizePercentageSegment(sizePercentageValue),
                        },
                    });
                }
                // Show error notification
                notifications.add({
                    title: t('transactions.buyOrderFailed'),
                    message:
                        result.error || t('transactions.transactionFailed'),
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: getTxLink(result.signature),
                });
            }
        } catch (error) {
            console.error('❌ Error submitting market buy order:', error);
            notifications.remove(slug);
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        actionType: 'Market Fail',
                        direction: 'Buy',
                        orderType: 'Market',
                        maxActive: maxActive,
                        skipConfirm: activeOptions.skipOpenOrderConfirm,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                        success: false,
                        leverage: getLeverageSegment(leverage),
                        sizePercentage:
                            getSizePercentageSegment(sizePercentageValue),
                    },
                });
            }
            notifications.add({
                title: t('transactions.buyOrderFailed'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('transactions.unknownErrorOccurred'),
                icon: 'error',
                removeAfter: 10000,
            });
        } finally {
            setIsProcessingOrder(false);
            confirmOrderModal.close();
        }
    }, [
        notionalQtyNum,
        sells,
        markPx,
        activeOptions.skipOpenOrderConfirm,
        symbol,
        executeMarketOrder,
        isSubminimumClose,
        subminimumCloseQty,
        leverage,
        isReduceOnlyEnabled,
        notifications,
        confirmOrderModal,
        t,
        formatNum,
        maxActive,
        sizePercentageValue,
    ]);

    // fn to submit a 'Sell' market order
    const submitMarketSell = useCallback(async (): Promise<void> => {
        // Validate position size
        if (!notionalQtyNum || notionalQtyNum <= 0) {
            notifications.add({
                title: t('transactions.invalidOrderSize.title'),
                message: t('transactions.enterValidOrderSize'),
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        const slug = makeSlug(10);

        try {
            // Get best bid price for sell order
            const bestBidPrice = buys.length > 0 ? buys[0].px : markPx;
            const usdValueOfOrderStr = formatNum(
                Math.round(notionalQtyNum * (bestBidPrice || 1) * 100) / 100,
                2,
                true,
                true,
            );
            setIsProcessingOrder(true);
            if (activeOptions.skipOpenOrderConfirm) {
                confirmOrderModal.close();
                notifications.add({
                    title: t('transactions.sellOrderPending'),
                    message: t('transactions.orderSubmittedFor', {
                        usdValueOfOrderStr,
                        symbol,
                    }),
                    icon: 'spinner',
                    slug,
                    removeAfter: 60000,
                });
            }

            const timeOfTxBuildStart = Date.now();

            // Execute the market sell order
            const result = await executeMarketOrder({
                quantity: isSubminimumClose
                    ? subminimumCloseQty
                    : notionalQtyNum,
                side: 'sell',
                leverage: leverage,
                bestBidPrice: bestBidPrice,
                reduceOnly: isReduceOnlyEnabled,
            });

            if (result.success) {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Market Success',
                            direction: 'Sell',
                            orderType: 'Market',
                            maxActive: maxActive,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            success: true,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                            leverage: getLeverageSegment(leverage),
                            sizePercentage:
                                getSizePercentageSegment(sizePercentageValue),
                        },
                    });
                }
                // Show success notification
                notifications.add({
                    title: t('transactions.sellOrderSuccessful'),
                    message: t('transactions.successfullySold', {
                        usdValueOfOrderStr,
                        symbol,
                    }),
                    icon: 'check',
                    removeAfter: 5000,
                    txLink: getTxLink(result.signature),
                });
                setShouldUpdateAfterTrade(true);
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Market Fail',
                            direction: 'Sell',
                            orderType: 'Market',
                            maxActive: maxActive,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            errorMessage: result.error || 'Transaction failed',
                            success: false,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                            leverage: getLeverageSegment(leverage),
                            sizePercentage:
                                getSizePercentageSegment(sizePercentageValue),
                        },
                    });
                }
                // Show error notification
                notifications.add({
                    title: t('transactions.sellOrderFailed'),
                    message:
                        result.error || t('transactions.transactionFailed'),
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: getTxLink(result.signature),
                });
            }
        } catch (error) {
            notifications.remove(slug);
            console.error('❌ Error submitting market sell order:', error);
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        actionType: 'Market Fail',
                        direction: 'Sell',
                        orderType: 'Market',
                        maxActive: maxActive,
                        skipConfirm: activeOptions.skipOpenOrderConfirm,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                        success: false,
                        leverage: getLeverageSegment(leverage),
                        sizePercentage:
                            getSizePercentageSegment(sizePercentageValue),
                    },
                });
            }
            notifications.add({
                title: t('transactions.sellOrderFailed'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('transactions.unknownErrorOccurred'),
                icon: 'error',
                removeAfter: 10000,
            });
        } finally {
            setIsProcessingOrder(false);
            confirmOrderModal.close();
        }
    }, [
        notionalQtyNum,
        buys,
        markPx,
        activeOptions.skipOpenOrderConfirm,
        symbol,
        executeMarketOrder,
        isSubminimumClose,
        subminimumCloseQty,
        leverage,
        isReduceOnlyEnabled,
        notifications,
        confirmOrderModal,
        t,
        formatNum,
        maxActive,
        sizePercentageValue,
    ]);

    // fn to submit a 'Buy' limit order
    const submitLimitBuy = useCallback(async (): Promise<void> => {
        // Validate position size
        if (!notionalQtyNum || notionalQtyNum <= 0) {
            notifications.add({
                title: t('transactions.invalidOrderSize.title'),
                message: t('transactions.enterValidOrderSize'),
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        // Validate price
        const limitPrice = parseFormattedNum(price);
        if (!limitPrice || limitPrice <= 0) {
            notifications.add({
                title: t('transactions.invalidPrice'),
                message: t('transactions.enterValidLimitPrice'),
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        setIsProcessingOrder(true);
        const slug = makeSlug(10);

        const usdValueOfOrderStr = formatNum(
            Math.round(notionalQtyNum * (markPx || 1) * 100) / 100,
            2,
            true,
            true,
        );

        if (activeOptions.skipOpenOrderConfirm) {
            confirmOrderModal.close();
            notifications.add({
                title: t('transactions.buyLongLimitOrderPending'),
                message: t('transactions.placingBuyLongLimitOrderFor', {
                    usdValueOfOrderStr,
                    symbol,
                    limitPrice,
                }),
                icon: 'spinner',
                slug,
                removeAfter: 60000,
            });
        }

        const timeOfTxBuildStart = Date.now();
        try {
            // Execute limit order
            const result = await executeLimitOrder({
                quantity: notionalQtyNum,
                price: roundDownToTenth(limitPrice),
                side: 'buy',
                leverage: leverage,
                reduceOnly: isReduceOnlyEnabled,
            });

            if (result.success) {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Success',
                            orderType: 'Limit',
                            direction: 'Buy',
                            maxActive: maxActive,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            success: true,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                            leverage: getLeverageSegment(leverage),
                            sizePercentage:
                                getSizePercentageSegment(sizePercentageValue),
                        },
                    });
                }
                notifications.add({
                    title: t('transactions.buyLongLimitOrderPlaced'),
                    message: t('transactions.successfullyPlacedBuyOrderFor', {
                        usdValueOfOrderStr,
                        symbol,
                        limitPrice,
                    }),
                    icon: 'check',
                    txLink: getTxLink(result.signature),
                    removeAfter: 5000,
                });
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Fail',
                            orderType: 'Limit',
                            direction: 'Buy',
                            maxActive: maxActive,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            errorMessage:
                                result.error || 'Failed to place limit order',
                            success: false,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                            leverage: getLeverageSegment(leverage),
                            sizePercentage:
                                getSizePercentageSegment(sizePercentageValue),
                        },
                    });
                }
                notifications.add({
                    title: t('transactions.limitOrderFailed'),
                    message:
                        result.error ||
                        t('transactions.failedToPlaceLimitOrder'),
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: getTxLink(result.signature),
                });
            }
        } catch (error) {
            notifications.remove(slug);
            console.error('❌ Error submitting limit buy order:', error);
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        actionType: 'Limit Fail',
                        orderType: 'Limit',
                        direction: 'Buy',
                        maxActive: maxActive,
                        skipConfirm: activeOptions.skipOpenOrderConfirm,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown Error Occurred',
                        success: false,
                        leverage: getLeverageSegment(leverage),
                        sizePercentage:
                            getSizePercentageSegment(sizePercentageValue),
                    },
                });
            }
            notifications.add({
                title: t('transactions.limitOrderFailed'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('transactions.unknownErrorOccurred'),
                icon: 'error',
                removeAfter: 10000,
            });
        } finally {
            setIsProcessingOrder(false);
            confirmOrderModal.close();
        }
    }, [
        notionalQtyNum,
        price,
        parseFormattedNum,
        activeOptions.skipOpenOrderConfirm,
        symbol,
        markPx,
        executeLimitOrder,
        leverage,
        isReduceOnlyEnabled,
        notifications,
        confirmOrderModal,
        t,
        formatNum,
        maxActive,
        sizePercentageValue,
    ]);

    // fn to submit a 'Sell' limit order
    const submitLimitSell = useCallback(async (): Promise<void> => {
        // Validate position size
        if (!notionalQtyNum || notionalQtyNum <= 0) {
            notifications.add({
                title: t('transactions.invalidOrderSize.title'),
                message: t('transactions.enterValidOrderSize'),
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        // Validate price
        const limitPrice = parseFormattedNum(price);
        if (!limitPrice || limitPrice <= 0) {
            notifications.add({
                title: t('transactions.invalidPrice'),
                message: t('transactions.enterValidLimitPrice'),
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        setIsProcessingOrder(true);

        const usdValueOfOrderStr = formatNum(
            Math.round(notionalQtyNum * (markPx || 1) * 100) / 100,
            2,
            true,
            true,
        );
        const slug = makeSlug(10);

        if (activeOptions.skipOpenOrderConfirm) {
            confirmOrderModal.close();
            notifications.add({
                title: t('transactions.sellShortLimitOrderPending'),
                message: t('transactions.placingLimitOrderFor', {
                    usdValueOfOrderStr,
                    symbol,
                    limitPrice: formatNum(limitPrice, 2, true, true),
                }),
                icon: 'spinner',
                slug,
                removeAfter: 60000,
            });
        }

        const timeOfTxBuildStart = Date.now();
        try {
            // Execute limit order
            const result = await executeLimitOrder({
                quantity: notionalQtyNum,
                price: roundDownToTenth(limitPrice),
                side: 'sell',
                leverage: leverage,
                reduceOnly: isReduceOnlyEnabled,
            });

            if (result.success) {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Success',
                            orderType: 'Limit',
                            direction: 'Sell',
                            maxActive: maxActive,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            success: true,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                            leverage: getLeverageSegment(leverage),
                            sizePercentage:
                                getSizePercentageSegment(sizePercentageValue),
                        },
                    });
                }
                notifications.add({
                    title: t('transactions.sellShortLimitOrderPlaced'),
                    message: t('transactions.successfullyPlacedSellOrderFor', {
                        usdValueOfOrderStr,
                        symbol,
                        limitPrice,
                    }),
                    icon: 'check',
                    txLink: getTxLink(result.signature),
                    removeAfter: 5000,
                });
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Limit Fail',
                            orderType: 'Limit',
                            direction: 'Sell',
                            maxActive: maxActive,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            errorMessage:
                                result.error || 'Failed to place limit order',
                            success: false,
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                            leverage: getLeverageSegment(leverage),
                            sizePercentage:
                                getSizePercentageSegment(sizePercentageValue),
                        },
                    });
                }
                notifications.add({
                    title: t('transactions.limitOrderFailed'),
                    message:
                        result.error ||
                        t('transactions.failedToPlaceLimitOrder'),
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: getTxLink(result.signature),
                });
            }
        } catch (error) {
            notifications.remove(slug);
            console.error('❌ Error submitting limit sell order:', error);
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        actionType: 'Limit Fail',
                        orderType: 'Limit',
                        direction: 'Sell',
                        maxActive: maxActive,
                        skipConfirm: activeOptions.skipOpenOrderConfirm,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                        success: false,
                        leverage: getLeverageSegment(leverage),
                        sizePercentage:
                            getSizePercentageSegment(sizePercentageValue),
                    },
                });
            }
            notifications.add({
                title: t('transactions.limitOrderFailed'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('transactions.unknownErrorOccurred'),
                icon: 'error',
                removeAfter: 10000,
            });
        } finally {
            setIsProcessingOrder(false);
            confirmOrderModal.close();
        }
    }, [
        notionalQtyNum,
        price,
        parseFormattedNum,
        activeOptions.skipOpenOrderConfirm,
        symbol,
        markPx,
        executeLimitOrder,
        leverage,
        isReduceOnlyEnabled,
        notifications,
        confirmOrderModal,
        t,
        formatNum,
        maxActive,
        sizePercentageValue,
    ]);

    // bool to handle toggle of order type launchpad mode
    const [showLaunchpad, setShowLaunchpad] = useState<boolean>(false);

    // hook to bind action to close launchpad to the DOM
    useKeydown('Escape', () => setShowLaunchpad(false));

    // const formattedSizeDisplay = formatNum(
    //     parseFormattedNum(sizeDisplay),
    //     selectedMode === 'symbol' ? 6 : 2,
    // );

    const [submitButtonRecentlyClicked, setSubmitButtonRecentlyClicked] =
        useState(false);

    const handleSubmitOrder = useCallback(() => {
        if (submitButtonRecentlyClicked) return;
        if (activeOptions.skipOpenOrderConfirm)
            setSubmitButtonRecentlyClicked(true);
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
    }, [
        submitButtonRecentlyClicked,
        activeOptions.skipOpenOrderConfirm,
        tradeDirection,
        marketOrderType,
        confirmOrderModal,
        submitMarketBuy,
        submitLimitBuy,
        submitMarketSell,
        submitLimitSell,
    ]);

    // Get portfolio modals state

    // Set up focus/blur handlers for the component
    useEffect(() => {
        const handleFocusIn = (e: FocusEvent) => {
            if (
                orderInputRef.current &&
                orderInputRef.current.contains(e.target as Node)
            ) {
                setIsFocused(true);
            }
        };

        const handleFocusOut = (e: FocusEvent) => {
            if (
                orderInputRef.current &&
                !orderInputRef.current.contains(e.relatedTarget as Node)
            ) {
                setIsFocused(false);
            }
        };

        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);

        // Set initial focus state
        if (
            orderInputRef.current &&
            orderInputRef.current.contains(document.activeElement)
        ) {
            setIsFocused(true);
        }

        return () => {
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    const isReduceInWrongDirection = useMemo(() => {
        return (
            isReduceOnlyEnabled &&
            !!marginBucket &&
            ((marginBucket.netPosition > 0n && tradeDirection === 'buy') ||
                (marginBucket.netPosition < 0n && tradeDirection === 'sell'))
        );
    }, [isReduceOnlyEnabled, marginBucket, tradeDirection]);

    const isReduceOnlyExceedingPositionSize = useMemo(() => {
        if (isNaN(notionalQtyNum)) return false;
        return (
            isReduceOnlyEnabled &&
            !!marginBucket &&
            (!marginBucket.netPosition ||
                (marginBucket.netPosition > 0n &&
                    tradeDirection === 'sell' &&
                    BigInt(Math.floor(notionalQtyNum * 1e8)) >
                        marginBucket.netPosition) ||
                (marginBucket.netPosition < 0n &&
                    tradeDirection === 'buy' &&
                    BigInt(Math.floor(notionalQtyNum * 1e8)) >
                        -1n * marginBucket.netPosition))
        );
    }, [isReduceOnlyEnabled, marginBucket, tradeDirection, notionalQtyNum]);

    const userExceededOI = useMemo(() => {
        return maxTradeSizeInUsd < 0;
    }, [maxTradeSizeInUsd]);

    const isDisabled =
        userExceededOI ||
        isDepositRequired ||
        isMarginInsufficientDebounced ||
        sizeLessThanMinimum ||
        sizeMoreThanMaximum ||
        isPriceInvalid ||
        submitButtonRecentlyClicked ||
        isReduceInWrongDirection ||
        isReduceOnlyExceedingPositionSize;

    // hook to handle Enter key press for order submission
    useEffect(() => {
        const handleEnter = () => {
            // Only submit if:
            // 1. The component is focused
            // 2. There's a valid notional/symbol quantity
            // 3. No modals are open
            // 4. Skip confirmation is not enabled

            const isSubmitButtonFocused = submitButtonRef.current
                ? document.activeElement === submitButtonRef.current
                : false;
            // Submit if either:
            // 1. The submit button is focused, or
            // 2. Skip confirmation is not enabled
            if (
                (isSubmitButtonFocused ||
                    (!activeOptions.skipOpenOrderConfirm && isFocused)) &&
                notionalQtyNum &&
                !confirmOrderModal.isOpen &&
                !isAnyPortfolioModalOpen &&
                !isDisabled
            ) {
                handleSubmitOrder();
            } else if (
                activeOptions.skipOpenOrderConfirm &&
                isFocused &&
                submitButtonRef.current
            ) {
                // focus the submit button
                submitButtonRef.current.focus();
            }
        };

        const keydownHandler = (e: KeyboardEvent) => {
            // Only handle Enter key when:
            // 1. The component is focused
            // 2. No modals are open
            // 3. The event target is not a textarea or input (to allow normal Enter behavior in form fields)
            const target = e.target as HTMLElement;
            const isFormElement =
                target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';

            if (
                e.key === 'Enter' &&
                isUserLoggedIn &&
                isFocused &&
                !confirmOrderModal.isOpen &&
                !isAnyPortfolioModalOpen &&
                !isFormElement &&
                !isDisabled
            ) {
                e.preventDefault();
                e.stopPropagation();
                handleEnter();
            }
        };

        document.addEventListener('keydown', keydownHandler, true); // Use capture phase to ensure we catch the event
        return () =>
            document.removeEventListener('keydown', keydownHandler, true);
    }, [
        tradeDirection,
        marketOrderType,
        activeOptions.skipOpenOrderConfirm,
        handleSubmitOrder,
        notionalQtyNum,
        isFocused,
        isDisabled,
    ]);

    const getDisabledReason = (
        userExceededOI: boolean,
        collateralInsufficientDebounced: boolean,
        sizeLessThanMinimum: boolean,
        sizeMoreThanMaximum: boolean,
        isPriceInvalid: boolean,
        isMarketOrderLoading: boolean,
        isReduceInWrongDirection: boolean,
        isReduceOnlyExceedingPositionSize: boolean,
    ) => {
        if (userExceededOI)
            return '1 BTC ' + t('transactions.positionLimitReached');
        if (isMarketOrderLoading) return t('transactions.processingOrder');
        if (isReduceInWrongDirection)
            return t('transactions.openPositionIsXSwitchToY', {
                x: tradeDirection,
                y: tradeDirection === 'buy' ? 'sell' : 'buy',
            });
        if (collateralInsufficientDebounced)
            return t('transactions.insufficientCollateral');
        if (isReduceOnlyExceedingPositionSize)
            return t('transactions.reduceOnlyExceedsPositionSize');
        if (sizeLessThanMinimum) return t('transactions.orderSizeBelowMinimum');
        if (sizeMoreThanMaximum)
            return t('transactions.orderSizeExceedsPositionLimits');
        if (isPriceInvalid) return t('transactions.invalidPrice');
        return null;
    };

    useEffect(() => {
        if (submitButtonRecentlyClicked) {
            const timeout = setTimeout(() => {
                setSubmitButtonRecentlyClicked(false);
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [submitButtonRecentlyClicked]);

    const disabledReason = getDisabledReason(
        userExceededOI,
        isMarginInsufficientDebounced,
        sizeLessThanMinimum,
        sizeMoreThanMaximum,
        isPriceInvalid,
        isMarketOrderLoading,
        isReduceInWrongDirection || false,
        isReduceOnlyExceedingPositionSize || false,
    );

    // const launchPadContent = (
    //     <div className={styles.launchpad}>
    //         <header>
    //             <div
    //                 className={styles.exit_launchpad}
    //                 onClick={() => setShowLaunchpad(false)}
    //             >
    //                 <MdKeyboardArrowLeft />
    //             </div>
    //             <h3>Order Types</h3>
    //             <button
    //                 className={styles.trade_type_toggle}
    //                 onClick={() => setShowLaunchpad(false)}
    //             >
    //                 <PiSquaresFour />
    //             </button>
    //         </header>
    //         <ul className={styles.launchpad_clickables}>
    //             {marketOrderTypes.map((mo: OrderTypeOption) => (
    //                 <li
    //                     key={JSON.stringify(mo)}
    //                     onClick={() => {
    //                         handleMarketOrderTypeChange(mo.value);
    //                         setShowLaunchpad(false);
    //                     }}
    //                 >
    //                     <div className={styles.name_and_icon}>
    //                         {mo.icon}
    //                         <h4>{mo.label}</h4>
    //                     </div>
    //                     <div>
    //                         <p>{mo.blurb}</p>
    //                     </div>
    //                 </li>
    //             ))}
    //         </ul>
    //     </div>
    // );

    useEffect(() => {
        if (typeof document !== 'undefined') {
            const el = document.querySelector(
                '[data-testid="submit-order-button"]',
            );
            submitButtonRef.current =
                el instanceof HTMLButtonElement ? el : null;
        }
    }, []);

    const submitButtonText = userExceededOI
        ? t('transactions.maxOpenInterestReached')
        : normalizedEquity < MIN_POSITION_USD_SIZE
          ? t('transactions.depositToTrade')
          : isReduceInWrongDirection
            ? t('transactions.switchDirectionToReduce')
            : isMarginInsufficientDebounced
              ? tradeDirection === 'buy'
                  ? t('transactions.maxLongDepositToTrade')
                  : t('transactions.maxShortDepositToTrade')
              : notionalQtyNum && sizeLessThanMinimum
                ? isReduceOnlyEnabled
                    ? `${formatNum(MIN_ORDER_VALUE, 2, true, true)} ${t('transactions.minimumOr100Percent')}`
                    : `${formatNum(MIN_ORDER_VALUE, 2, true, true)} ${t('transactions.minimum')}`
                : t('common.submit');

    const inputDetailsData = useMemo(
        () => [
            {
                label: t('transactions.availableToTrade'),
                tooltipLabel: t('transactions.availableToTradeTooltip', {
                    symbol: 'fUSD',
                }),
                value: displayNumAvailableToTrade,
            },
            {
                label: t('transactions.currentPosition'),
                tooltipLabel: t('transactions.currentPositionTooltip', {
                    symbol,
                }),
                value: `${displayNumCurrentPosition} ${symbol}`,
            },
        ],
        [
            displayNumAvailableToTrade,
            displayNumCurrentPosition,
            symbol,
            language,
        ],
    );

    const maxTradeSizeWarningLong = useMemo(
        () =>
            tradeDirection === 'buy'
                ? marginBucket?.netPosition && marginBucket.netPosition > 0
                    ? t('transactions.yourPositionIsLimitedByOpenInterest', {
                          coin: symbolInfo?.coin.toUpperCase(),
                          limitedBy:
                              symbolInfo?.coin.toUpperCase() === 'BTC'
                                  ? '1 BTC'
                                  : 'total open interest',
                      })
                    : t('transactions.currentMaxTradeSizeForMarket', {
                          limit:
                              symbolInfo?.coin.toUpperCase() === 'BTC'
                                  ? '1 BTC'
                                  : 'limited',
                      })
                : marginBucket?.netPosition && marginBucket.netPosition < 0
                  ? t('transactions.yourPositionIsLimitedByOpenInterest', {
                        coin: symbolInfo?.coin.toUpperCase(),
                        limitedBy:
                            symbolInfo?.coin.toUpperCase() === 'BTC'
                                ? '1 BTC'
                                : 'total open interest',
                    })
                  : t('transactions.currentMaxTradeSizeForMarket', {
                        limit:
                            symbolInfo?.coin.toUpperCase() === 'BTC'
                                ? '1 BTC'
                                : 'limited',
                    }),
        [tradeDirection, marginBucket, symbolInfo?.coin.toUpperCase()],
    );

    const maxTradeSizeWarningShort = useMemo(
        () =>
            tradeDirection === 'buy'
                ? marginBucket?.netPosition && marginBucket.netPosition > 0
                    ? t('transactions.maxPosSizeLimitedByOiCap')
                    : t('transactions.maxTradeSizeLimitedTo') +
                      (symbolInfo?.coin.toUpperCase() === 'BTC' ? ' 1 BTC' : '')
                : marginBucket?.netPosition && marginBucket.netPosition < 0
                  ? t('transactions.maxPosSizeLimitedByOiCap')
                  : t('transactions.maxTradeSizeLimitedTo') +
                    (symbolInfo?.coin.toUpperCase() === 'BTC' ? ' 1 BTC' : ''),
        [tradeDirection, marginBucket, symbolInfo?.coin.toUpperCase()],
    );

    return (
        <div ref={orderInputRef} className={styles.order_input}>
            {showLaunchpad ? (
                <div className={styles.launchpad}>
                    <header>
                        <div
                            className={styles.exit_launchpad}
                            onClick={() => setShowLaunchpad(false)}
                        >
                            <MdKeyboardArrowLeft
                                aria-label={t('aria.closeTradeTypeMenu')}
                            />
                        </div>
                        <h3>{t('transactions.orderTypes')}</h3>
                        <button
                            className={styles.trade_type_toggle}
                            aria-label={t('aria.tradeType')}
                            onClick={() => setShowLaunchpad(false)}
                        >
                            <PiSquaresFour
                                aria-label={t('aria.closeTradeTypeMenu')}
                            />
                        </button>
                    </header>
                    <ul className={styles.launchpad_clickables}>
                        {marketOrderTypes.map((mo: OrderTypeOption) => (
                            <li
                                key={JSON.stringify(mo.value)}
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
                            <SimpleButton
                                className={styles.margin_type_btn}
                                onClick={() => confirmOrderModal.open('margin')}
                                bg='dark3'
                                hoverBg='accent1'
                            >
                                {t(marginMode)}
                            </SimpleButton>
                            <button
                                className={styles.trade_type_toggle}
                                aria-label={t('aria.tradeType')}
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
                                            <LuCircleHelp size={12} />
                                        </Tooltip>
                                    </div>
                                    <span className={styles.inputDetailValue}>
                                        {data.value}
                                    </span>
                                </div>
                            ))}
                            {!isReduceOnlyEnabled &&
                                maxOrderSizeWouldExceedRemainingOIDebounced &&
                                (!!sizePercentageValue || !!sizeDisplay) && (
                                    <div
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: 'var(--orange)',
                                                justifyContent: 'center',
                                                width: '100%',
                                                fontSize: 'var(--font-size-s)',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    cursor: 'default',
                                                }}
                                            >
                                                {maxTradeSizeWarningShort}
                                            </span>
                                            <Tooltip
                                                content={
                                                    maxTradeSizeWarningLong
                                                }
                                                position='bottom'
                                            >
                                                <LuCircleHelp size={12} />
                                            </Tooltip>
                                        </div>
                                    </div>
                                )}
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
                        <PositionSize {...sizeSliderPercentageValueProps} />

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
                    <div
                        key='buttondetails'
                        className={styles.button_details_container}
                    >
                        {isUserLoggedIn && (
                            <Tooltip
                                content={disabledReason}
                                position='top'
                                disabled={!isDisabled}
                            >
                                <button
                                    ref={submitButtonRef}
                                    data-testid='submit-order-button'
                                    className={`${styles.submit_button}`}
                                    style={{
                                        backgroundColor:
                                            tradeDirection === 'buy'
                                                ? buyColor
                                                : sellColor,
                                        fontSize:
                                            submitButtonText.length > 20
                                                ? 'var(--font-size-s)'
                                                : 'var(--font-size-m)',
                                    }}
                                    onClick={handleSubmitOrder}
                                    disabled={isDisabled}
                                >
                                    {submitButtonText}
                                </button>
                            </Tooltip>
                        )}
                        <OrderDetails
                            orderMarketPrice={marketOrderType}
                            usdOrderValue={usdOrderValue}
                            marginRequired={marginRequired}
                            liquidationPrice={liquidationPrice}
                        />
                    </div>
                </>
            )}
            {confirmOrderModal.isOpen && (
                <Modal
                    close={confirmOrderModal.close}
                    title={
                        confirmOrderModal.content === 'margin'
                            ? t('transactions.marginMode')
                            : confirmOrderModal.content === 'scale'
                              ? t('transactions.scaleOptions')
                              : confirmOrderModal.content === 'market_buy'
                                ? t('transactions.confirmBuyOrder')
                                : confirmOrderModal.content === 'market_sell'
                                  ? t('transactions.confirmSellOrder')
                                  : confirmOrderModal.content === 'limit_buy'
                                    ? t('transactions.confirmLimitBuyOrder')
                                    : confirmOrderModal.content === 'limit_sell'
                                      ? t('transactions.confirmLimitSellOrder')
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
                                qty: formatNum(
                                    notionalQtyNum,
                                    6,
                                    false,
                                    false,
                                    false,
                                    false,
                                    0,
                                    true,
                                ),
                                denom: symbolInfo?.coin || '',
                            }}
                            usdOrderValue={usdOrderValue}
                            isEnabled={!activeOptions.skipOpenOrderConfirm}
                            toggleEnabled={() =>
                                activeOptions.toggle('skipOpenOrderConfirm')
                            }
                            submitFn={submitMarketBuy}
                            isProcessing={isProcessingOrder}
                            setIsProcessingOrder={setIsProcessingOrder}
                            liquidationPrice={liquidationPrice}
                        />
                    )}
                    {confirmOrderModal.content === 'market_sell' && (
                        <ConfirmationModal
                            tx='market_sell'
                            size={{
                                qty: formatNum(
                                    notionalQtyNum,
                                    6,
                                    false,
                                    false,
                                    false,
                                    false,
                                    0,
                                    true,
                                ),
                                denom: symbolInfo?.coin || '',
                            }}
                            usdOrderValue={usdOrderValue}
                            submitFn={submitMarketSell}
                            toggleEnabled={() =>
                                activeOptions.toggle('skipOpenOrderConfirm')
                            }
                            isEnabled={!activeOptions.skipOpenOrderConfirm}
                            isProcessing={isProcessingOrder}
                            setIsProcessingOrder={setIsProcessingOrder}
                            liquidationPrice={liquidationPrice}
                        />
                    )}
                    {confirmOrderModal.content === 'limit_buy' && (
                        <ConfirmationModal
                            tx='limit_buy'
                            size={{
                                qty: formatNum(
                                    notionalQtyNum,
                                    6,
                                    false,
                                    false,
                                    false,
                                    false,
                                    0,
                                    true,
                                ),
                                denom: symbolInfo?.coin || '',
                            }}
                            usdOrderValue={usdOrderValue}
                            limitPrice={formatNum(
                                parseFormattedNum(price),
                                2,
                                true,
                                true,
                                false,
                                false,
                                0,
                                true,
                            )}
                            submitFn={submitLimitBuy}
                            toggleEnabled={() =>
                                activeOptions.toggle('skipOpenOrderConfirm')
                            }
                            isEnabled={!activeOptions.skipOpenOrderConfirm}
                            isProcessing={isProcessingOrder}
                            setIsProcessingOrder={setIsProcessingOrder}
                            liquidationPrice={liquidationPrice}
                        />
                    )}
                    {confirmOrderModal.content === 'limit_sell' && (
                        <ConfirmationModal
                            tx='limit_sell'
                            size={{
                                qty: formatNum(
                                    notionalQtyNum,
                                    6,
                                    false,
                                    false,
                                    false,
                                    false,
                                    0,
                                    true,
                                ),
                                denom: symbolInfo?.coin || '',
                            }}
                            usdOrderValue={usdOrderValue}
                            limitPrice={formatNum(
                                parseFormattedNum(price),
                                2,
                                true,
                                true,
                                false,
                                false,
                                0,
                                true,
                            )}
                            submitFn={submitLimitSell}
                            toggleEnabled={() =>
                                activeOptions.toggle('skipOpenOrderConfirm')
                            }
                            isEnabled={!activeOptions.skipOpenOrderConfirm}
                            isProcessing={isProcessingOrder}
                            setIsProcessingOrder={setIsProcessingOrder}
                            liquidationPrice={liquidationPrice}
                        />
                    )}
                </Modal>
            )}
        </div>
    );
}

export default memo(OrderInput);
