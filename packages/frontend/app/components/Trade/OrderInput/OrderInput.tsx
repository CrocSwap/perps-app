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
    type JSX,
} from 'react';
import { GoZap } from 'react-icons/go';
import { LuCircleHelp } from 'react-icons/lu';
import { MdKeyboardArrowLeft } from 'react-icons/md';
import { PiArrowLineDown, PiSquaresFour } from 'react-icons/pi';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useKeydown } from '~/hooks/useKeydown';
import { useLimitOrderService } from '~/hooks/useLimitOrderService';
import { useMarketOrderService } from '~/hooks/useMarketOrderService';
import { useModal } from '~/hooks/useModal';
import useNumFormatter from '~/hooks/useNumFormatter';
import packageJson from '../../../../package.json';
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
import { blockExplorer, MIN_POSITION_USD_SIZE } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getDurationSegment';
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

const useOnlyMarket = false;

const marketOrderTypes = useOnlyMarket
    ? [
          {
              value: 'market',
              label: 'Market',
              blurb: 'Buy/sell at the current price',
              icon: <GoZap color={'var(--accent1)'} size={25} />,
          },
      ]
    : [
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
    isAnyPortfolioModalOpen,
}: {
    marginBucket: MarginBucketAvail | null;
    isAnyPortfolioModalOpen: boolean;
}) {
    // Track if the OrderInput component is focused
    const [isFocused, setIsFocused] = useState(false);
    const orderInputRef = useRef<HTMLDivElement>(null);
    const { getBsColor } = useAppSettings();

    const sessionState = useSession();
    const activeOptions: useAppOptionsIF = useAppOptions();

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

    const { executeLimitOrder } = useLimitOrderService();

    // Get the current leverage from the store and subscribe to changes
    const leverage = useLeverageStore((state) => state.currentLeverage);
    const setLeverage = useLeverageStore((state) => state.setPreferredLeverage);

    const [price, setPrice] = useState('');

    const [stopPrice, setStopPrice] = useState('');

    const [positionSliderPercentageValue, setPositionSliderPercentageValue] =
        useState(0);

    const [notionalSymbolQtyNum, setNotionalSymbolQtyNum] = useState(0);
    // Track if we're processing an order
    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    const [sizeDisplay, setSizeDisplay] = useState('');

    const isPriceInvalid = useMemo(() => {
        return (
            marketOrderType === 'limit' &&
            (price === '' || price === '0' || price === '0.0')
        );
    }, [price, marketOrderType]);

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

    const minNotionalUsdOrderSize = 0.99;
    const [maxNotionalUsdOrderSize, setMaxNotionalUsdOrderSize] =
        useState<number>(100_000);

    const OI_BUFFER = 100;

    useEffect(() => {
        if (!marginBucket) return;
        const maxRemainingOI = maxRemainingUserNotionalOI(
            marginBucket,
            tradeDirection === 'buy',
        );
        const unscaledMaxRemainingOI = Number(maxRemainingOI) / 1e6;
        setMaxNotionalUsdOrderSize(unscaledMaxRemainingOI - OI_BUFFER);
    }, [marginBucket, tradeDirection]);

    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('usd');

    const {
        obChosenPrice,
        // obChosenAmount,
        symbol,
        symbolInfo,
        marginMode,
        setMarginMode,
    } = useTradeDataStore();

    const { buys, sells } = useOrderBookStore();
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

    const setMidPriceAsPriceInput = () => {
        if (
            marketOrderType === 'limit' &&
            buys.length > 0 &&
            sells.length > 0
        ) {
            const resolution = buys[0].px - buys[1].px;
            const midOrMarkPrice = resolution <= 1 ? getMidPrice() : markPx;
            if (!midOrMarkPrice) return;
            const formattedMidPrice = formatNumWithOnlyDecimals(
                midOrMarkPrice,
                6,
                true,
            );
            setPrice(formattedMidPrice);
        }
    };

    const normalizedEquity = useMemo(() => {
        if (!marginBucket) return 0;
        return Number(marginBucket?.equity) / 1e6;
    }, [marginBucket]);

    useEffect(() => {
        // set mid price input as default price when market changes
        if (!obChosenPrice) {
            setMidPriceAsPriceInput();
        }
        setIsMidModeActive(false);
    }, [
        marketOrderType,
        !buys.length,
        !sells.length,
        buys?.[0]?.coin,
        obChosenPrice,
    ]);

    const [isMidModeActive, setIsMidModeActive] = useState(false);
    const confirmOrderModal = useModal<modalContentT>('closed');

    useEffect(() => {
        // Don't update price if confirm modal is open
        if (isMidModeActive && !confirmOrderModal.isOpen) {
            setMidPriceAsPriceInput();
        }
    }, [
        isMidModeActive,
        marketOrderType,
        !buys.length,
        !sells.length,
        buys?.[0]?.px,
        sells?.[0]?.px,
        markPx,
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

    const [userExceededAvailableMargin, setUserExceededAvailableMargin] =
        useState(false);

    const [leverageFloor, setLeverageFloor] = useState<number>();

    const [currentPositionNotionalSize, setCurrentPositionNotionalSize] =
        useState(0);

    const [isEditingSizeInput, setIsEditingSizeInput] = useState(false);

    const [liquidationPrice, setLiquidationPrice] = useState<number | null>(
        null,
    );

    useEffect(() => {
        if (!marginBucket) {
            setLeverageFloor(undefined);
            return;
        }
        try {
            const leverageFloor = calcLeverageFloor(marginBucket, 10_000_000n);
            const leverageFloorNum = Number(leverageFloor);
            if (!leverageFloorNum) return;
            setLeverageFloor(10_000 / leverageFloorNum);
        } catch {
            setLeverageFloor(100);
        }
    }, [marginBucket]);

    useEffect(() => {
        if (!marginBucket) {
            setCurrentPositionNotionalSize(0);
            return;
        }

        const currentPositionNotionalSize = marginBucket?.netPosition || 0;
        const normalizedCurrentPosition =
            Number(currentPositionNotionalSize) / 100_000_000;
        setCurrentPositionNotionalSize(normalizedCurrentPosition);
    }, [marginBucket, leverage, tradeDirection]);

    // Calculate liquidation price
    useEffect(() => {
        if (
            !marginBucket ||
            !notionalSymbolQtyNum ||
            notionalSymbolQtyNum === 0
        ) {
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
            // notionalSymbolQtyNum is already in human-readable format, need to scale to 10^8
            const orderQty =
                notionalSymbolQtyNum * (tradeDirection === 'buy' ? 1 : -1);

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
    }, [
        marginBucket,
        notionalSymbolQtyNum,
        tradeDirection,
        buys,
        sells,
        markPx,
    ]);

    // function roundDownToMillionth(value: number) {
    //     return Math.floor(value * 1_000_000) / 1_000_000;
    // }

    function roundDownToHundredth(value: number) {
        return Math.floor(value * 100) / 100;
    }
    function roundDownToTenth(value: number) {
        return Math.floor(value * 10) / 10;
    }

    const notionalUsdOrderSizeNum =
        Math.floor(notionalSymbolQtyNum * (markPx || 1) * 100) / 100;

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

    const userBuyingPowerExceedsMaxOrderSize =
        usdAvailableToTrade * leverage > maxNotionalUsdOrderSize;

    const [isMaxModeEnabled, setIsMaxModeEnabled] = useState(false);

    useEffect(() => {
        if (
            !userExceededAvailableMargin &&
            isMaxModeEnabled &&
            markPx &&
            !isEditingSizeInput &&
            !userBuyingPowerExceedsMaxOrderSize
        ) {
            if (isReduceOnlyEnabled) {
                if (!marginBucket?.netPosition) return;
                const unscaledPositionSize =
                    Math.abs(Number(marginBucket.netPosition)) / 1e8;
                setNotionalSymbolQtyNum(unscaledPositionSize);
            } else {
                const maxNotionalSize =
                    (usdAvailableToTrade / markPx) * leverage;

                if (maxNotionalSize > 0) {
                    setNotionalSymbolQtyNum(maxNotionalSize);
                }
            }
        }
    }, [
        isMaxModeEnabled,
        usdAvailableToTrade,
        leverage,
        markPx,
        isEditingSizeInput,
        userExceededAvailableMargin,
        isReduceOnlyEnabled,
        userBuyingPowerExceedsMaxOrderSize,
        marginBucket?.netPosition,
    ]);

    const sizeLessThanMinimum =
        !notionalUsdOrderSizeNum ||
        notionalUsdOrderSizeNum < minNotionalUsdOrderSize;

    const sizeMoreThanMaximum =
        notionalUsdOrderSizeNum > maxNotionalUsdOrderSize + OI_BUFFER;

    const currentPositionLessThanMinPositionSize =
        Math.abs(currentPositionNotionalSize) * (markPx || 1) <
        MIN_POSITION_USD_SIZE;

    const displayNumAvailableToTradeLessThanMinPositionSize =
        Math.abs(usdAvailableToTrade) < MIN_POSITION_USD_SIZE;

    const displayNumAvailableToTrade = useMemo(() => {
        return displayNumAvailableToTradeLessThanMinPositionSize
            ? formatNum(0, 2, false, true)
            : formatNum(usdAvailableToTrade, 2, false, true);
    }, [usdAvailableToTrade, activeGroupSeparator]);

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
            notionalSymbolQtyNum
        ) {
            orderValue = notionalSymbolQtyNum * (markPx || 1);
        }
        return orderValue;
    }, [notionalSymbolQtyNum, marketOrderType, markPx]);

    const marginRequired = useMemo(() => {
        return usdOrderValue / leverage;
    }, [usdOrderValue, leverage]);

    const collateralInsufficient = useMemo(() => {
        return (
            !usdAvailableToTrade || usdAvailableToTrade < marginRequired - 0.01
        );
    }, [usdAvailableToTrade, marginRequired]);

    function useCollateralInsufficientDebounce(
        value: boolean,
        delay: number,
    ): boolean {
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

    const collateralInsufficientDebounced = useCollateralInsufficientDebounce(
        collateralInsufficient,
        500,
    );

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
            setIsMidModeActive(false);
            setPrice(formatNumWithOnlyDecimals(obChosenPrice));
            handleTypeChange();
        }
        // commented out to match HL functionality and not assume trade direction
        // const midPrice = getMidPrice();
        // if (!midPrice) return;
        // if (obChosenPrice > midPrice) {
        //     setTradeDirection('sell');
        // } else {
        //     setTradeDirection('buy');
        // }
    }, [obChosenPrice]);

    const handleMarketOrderTypeChange = useCallback((value: string) => {
        setMarketOrderType(value);
    }, []);

    const handleLeverageChange = (value: number) => {
        setLeverage(value);
    };

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
        if (!isEditingSizeInput && !userExceededAvailableMargin) {
            if (selectedMode === 'symbol') {
                setSizeDisplay(
                    notionalSymbolQtyNum
                        ? formatNumWithOnlyDecimals(
                              notionalSymbolQtyNum,
                              6,
                              true,
                          )
                        : '',
                );
            } else if (markPx) {
                const newSizeString = notionalSymbolQtyNum
                    ? formatNumWithOnlyDecimals(
                          notionalSymbolQtyNum * markPx,
                          2,
                          false,
                      )
                    : '';
                setSizeDisplay(newSizeString);
            }
        }
    }, [
        notionalSymbolQtyNum,
        selectedMode,
        isEditingSizeInput,
        leverage,
        userExceededAvailableMargin,
    ]);

    const getPercentFromAvailableToTrade = useCallback(() => {
        const minAvailableOrMaxOI = Math.min(
            usdAvailableToTrade * leverage,
            maxNotionalUsdOrderSize,
        );

        return (
            ((notionalSymbolQtyNum * (markPx || 1)) / minAvailableOrMaxOI) * 100
        );
    }, [
        notionalSymbolQtyNum,
        leverage,
        markPx,
        usdAvailableToTrade,
        userBuyingPowerExceedsMaxOrderSize,
        maxNotionalUsdOrderSize,
    ]);

    useEffect(() => {
        let percent = 0;
        if (isReduceOnlyEnabled) {
            if (isMaxModeEnabled) {
                percent = 100;
            } else if (marginBucket?.netPosition) {
                const unscaledPositionSize =
                    Math.abs(Number(marginBucket?.netPosition)) / 1e8;
                percent = Math.min(
                    (notionalSymbolQtyNum / unscaledPositionSize) * 100,
                    100,
                );
            }
        } else {
            if (!usdAvailableToTrade) return;
            percent = Math.min(getPercentFromAvailableToTrade(), 100);
        }
        setUserExceededAvailableMargin(false);
        setPositionSliderPercentageValue(percent);
    }, [!!usdAvailableToTrade, isReduceOnlyEnabled, isMaxModeEnabled]);

    useEffect(() => {
        let percent = 0;

        setIsEditingSizeInput(false);

        if (isReduceOnlyEnabled) {
            if (marginBucket?.netPosition) {
                const unscaledPositionSize =
                    Math.abs(Number(marginBucket?.netPosition)) / 1e8;
                percent = Math.min(
                    (notionalSymbolQtyNum / unscaledPositionSize) * 100,
                    100,
                );
            }
        } else {
            if (!usdAvailableToTrade) return;
            percent = Math.min(getPercentFromAvailableToTrade(), 100);
        }
        setUserExceededAvailableMargin(false);
        setPositionSliderPercentageValue(percent);
        if (percent === 100) {
            setIsMaxModeEnabled(true);
        } else {
            setIsMaxModeEnabled(false);
        }
    }, [leverage]);

    const handleOnFocus = () => {
        setIsEditingSizeInput(true);
    };

    const handleSizeChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement> | string) => {
            setIsEditingSizeInput(true);
            setIsMaxModeEnabled(false);
            if (typeof event === 'string') {
                setSizeDisplay(event);
            } else {
                setSizeDisplay(event.target.value);
            }
        },
        [],
    );

    const handleSizeInputUpdate = useCallback(() => {
        const parsed = parseFormattedNum(sizeDisplay.trim());
        if (!isNaN(parsed)) {
            const adjusted =
                selectedMode === 'symbol' ? parsed : parsed / (markPx || 1);
            setNotionalSymbolQtyNum(
                isMaxModeEnabled || parsed === maxNotionalUsdOrderSize
                    ? isReduceOnlyEnabled
                        ? Math.abs(Number(marginBucket?.netPosition)) / 1e8
                        : userBuyingPowerExceedsMaxOrderSize
                          ? maxNotionalUsdOrderSize / (markPx || 1)
                          : (usdAvailableToTrade * leverage) / (markPx || 1)
                    : adjusted,
            );
            if (isUserLoggedIn) {
                const usdValue = isMaxModeEnabled
                    ? userBuyingPowerExceedsMaxOrderSize
                        ? maxNotionalUsdOrderSize
                        : usdAvailableToTrade * leverage
                    : selectedMode === 'symbol'
                      ? adjusted * (markPx || 1)
                      : parsed;
                let percent = 0;
                if (isReduceOnlyEnabled) {
                    if (marginBucket?.netPosition) {
                        const unscaledPositionSize =
                            Math.abs(Number(marginBucket?.netPosition)) / 1e8;
                        percent =
                            (usdValue /
                                (unscaledPositionSize * (markPx || 1))) *
                            100;
                    }
                } else {
                    percent = userBuyingPowerExceedsMaxOrderSize
                        ? (usdValue / maxNotionalUsdOrderSize) * 100
                        : (usdValue / leverage / usdAvailableToTrade) * 100;
                }
                if (isNaN(percent) || percent === Infinity) return;
                if (percent > 100) {
                    setUserExceededAvailableMargin(true);
                    setPositionSliderPercentageValue(100);
                } else {
                    setUserExceededAvailableMargin(false);
                    if (percent > 99) {
                        setPositionSliderPercentageValue(100);
                    } else {
                        setPositionSliderPercentageValue(percent);
                        setIsMaxModeEnabled(false);
                    }
                }
            }
        } else if (sizeDisplay.trim() === '') {
            setNotionalSymbolQtyNum(0);
        }
    }, [
        sizeDisplay,
        selectedMode,
        markPx,
        leverage,
        isUserLoggedIn,
        isReduceOnlyEnabled,
        usdAvailableToTrade,
        marginBucket?.netPosition,
        maxNotionalUsdOrderSize,
        userBuyingPowerExceedsMaxOrderSize,
        isMaxModeEnabled,
        userExceededAvailableMargin,
    ]);

    useEffect(() => {
        if (!userExceededAvailableMargin) handleSizeInputUpdate();
    }, [tradeDirection]);

    // update slider on debounce after user has paused typing and updating sizeDisplay
    useEffect(() => {
        if (isEditingSizeInput) {
            if (sizeDisplay === '') {
                handleSizeInputUpdate();
            } else {
                const timeout = setTimeout(() => {
                    handleSizeInputUpdate();
                }, 500);
                return () => clearTimeout(timeout);
            }
        }
    }, [sizeDisplay, isEditingSizeInput]);

    useEffect(() => {
        updateSliderAfterOrder();
    }, [usdAvailableToTrade]);

    const handleSizeInputBlur = useCallback(() => {
        handleSizeInputUpdate();
        setIsEditingSizeInput(false);
    }, [handleSizeInputUpdate]);

    const handleSizeKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === 'Enter') {
            if (!isUserLoggedIn || isDisabled) return;
            if (activeOptions.skipOpenOrderConfirm) {
                (submitButton as HTMLElement)?.focus();
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
        setIsMidModeActive(false);
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
            if (!isUserLoggedIn || isDisabled) return;
            if (activeOptions.skipOpenOrderConfirm) {
                (submitButton as HTMLElement)?.focus();
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
                (submitButton as HTMLElement)?.focus();
                event.preventDefault();
            } else {
                handleSubmitOrder();
            }
        }
    };

    const setNotionalSymbolQtyNumFromUsdAvailableToTrade = (value: number) => {
        let notionalSymbolQtyNum;
        if (marketOrderType === 'market') {
            if (userBuyingPowerExceedsMaxOrderSize) {
                notionalSymbolQtyNum =
                    ((value / 100) * maxNotionalUsdOrderSize) / (markPx || 1);
            } else {
                notionalSymbolQtyNum =
                    (((value / 100) * usdAvailableToTrade) / (markPx || 1)) *
                    leverage;
            }
        } else if (marketOrderType === 'limit') {
            if (!markPx) return;
            if (userBuyingPowerExceedsMaxOrderSize) {
                notionalSymbolQtyNum =
                    ((value / 100) * maxNotionalUsdOrderSize) / (markPx || 1);
            } else {
                notionalSymbolQtyNum =
                    (((value / 100) * usdAvailableToTrade) / (markPx || 1)) *
                    leverage;
            }
        }
        if (notionalSymbolQtyNum) setNotionalSymbolQtyNum(notionalSymbolQtyNum);
    };

    const setNotationalSymbolQtyFromPositionSize = (value: number) => {
        if (isReduceOnlyEnabled && !!marginBucket) {
            // divide bigint by 1e8 to unscale
            const unscaledPositionSize =
                Math.abs(Number(marginBucket.netPosition)) / 1e8;
            const notionalSymbolQtyNum =
                (value / 100) * Number(unscaledPositionSize);

            setNotionalSymbolQtyNum(notionalSymbolQtyNum);
        }
    };

    // POSITION SIZE------------------------------
    const handleSizeSliderChange = (value: number) => {
        setIsEditingSizeInput(false);
        setUserExceededAvailableMargin(false);
        setPositionSliderPercentageValue(value);
        if (value === 100) {
            setIsMaxModeEnabled(true);
        } else {
            setIsMaxModeEnabled(false);
        }
        if (isReduceOnlyEnabled) {
            setNotationalSymbolQtyFromPositionSize(value);
        } else {
            setNotionalSymbolQtyNumFromUsdAvailableToTrade(value);
        }
    };

    useEffect(() => {
        if (!isReduceOnlyEnabled && !notionalSymbolQtyNum)
            setNotionalSymbolQtyNumFromUsdAvailableToTrade(
                positionSliderPercentageValue,
            );
    }, [isReduceOnlyEnabled]);

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
                            <LuCircleHelp size={12} />
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
            value: leverage,
            onChange: handleLeverageChange,
            minNotionalUsdOrderSize: minNotionalUsdOrderSize,
            minimumValue: useMockLeverage ? mockMinimumLeverage : leverageFloor,
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
            ariaLabel: 'Size input',
            symbol,
            selectedMode,
            setSelectedMode,
            useTotalSize,
            autoFocus: window.innerWidth > 768, // do not autofocus on mobile
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

    const updateSliderAfterOrder = useCallback(() => {
        if (!isEditingSizeInput) handleSizeInputUpdate();
    }, [isEditingSizeInput, handleSizeInputUpdate]);

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

        const slug = makeSlug(10);

        try {
            setIsProcessingOrder(true);
            // Get best ask price for buy order
            const bestAskPrice = sells.length > 0 ? sells[0].px : markPx;
            const usdValueOfOrderStr = formatNum(
                roundDownToHundredth(
                    notionalSymbolQtyNum * (bestAskPrice || 1),
                ),
                2,
                true,
                true,
            );
            if (activeOptions.skipOpenOrderConfirm) {
                confirmOrderModal.close();
                notifications.add({
                    title: 'Buy Order Pending',
                    message: `Order submitted for ${usdValueOfOrderStr} of ${symbol}`,
                    icon: 'spinner',
                    slug,
                    removeAfter: 60000,
                });
            }

            const timeOfTxBuildStart = Date.now();

            // Execute the market buy order
            const result = await executeMarketOrder({
                quantity: notionalSymbolQtyNum,
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
                            version: packageJson.version,
                            actionType: 'Market Success',
                            direction: 'Buy',
                            orderType: 'Market',
                            maxActive: isMaxModeEnabled,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                // Show success notification
                notifications.add({
                    title: 'Buy Order Successful',
                    message: `Successfully bought ${usdValueOfOrderStr} of ${symbol}`,
                    icon: 'check',
                    removeAfter: 5000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
                updateSliderAfterOrder();
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Market Fail',
                            direction: 'Buy',
                            orderType: 'Market',
                            maxActive: isMaxModeEnabled,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            errorMessage: result.error || 'Transaction failed',
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                // Show error notification
                notifications.add({
                    title: 'Buy Order Failed',
                    message: result.error || 'Transaction failed',
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
            }
        } catch (error) {
            console.error('❌ Error submitting market buy order:', error);
            notifications.remove(slug);
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        version: packageJson.version,
                        actionType: 'Market Fail',
                        direction: 'Buy',
                        orderType: 'Market',
                        maxActive: isMaxModeEnabled,
                        skipConfirm: activeOptions.skipOpenOrderConfirm,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                    },
                });
            }
            notifications.add({
                title: 'Buy Order Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
                removeAfter: 10000,
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

        const slug = makeSlug(10);

        try {
            // Get best bid price for sell order
            const bestBidPrice = buys.length > 0 ? buys[0].px : markPx;
            const usdValueOfOrderStr = formatNum(
                Math.round(notionalSymbolQtyNum * (bestBidPrice || 1) * 100) /
                    100,
                2,
                true,
                true,
            );
            setIsProcessingOrder(true);
            if (activeOptions.skipOpenOrderConfirm) {
                confirmOrderModal.close();
                notifications.add({
                    title: 'Sell Order Pending',
                    message: `Order submitted for ${usdValueOfOrderStr} of ${symbol}`,
                    icon: 'spinner',
                    slug,
                    removeAfter: 60000,
                });
            }

            const timeOfTxBuildStart = Date.now();

            // Execute the market sell order
            const result = await executeMarketOrder({
                quantity: notionalSymbolQtyNum,
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
                            version: packageJson.version,
                            actionType: 'Market Success',
                            direction: 'Sell',
                            orderType: 'Market',
                            maxActive: isMaxModeEnabled,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                // Show success notification
                notifications.add({
                    title: 'Sell Order Successful',
                    message: `Successfully sold ${usdValueOfOrderStr} of ${symbol}`,
                    icon: 'check',
                    removeAfter: 5000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
                updateSliderAfterOrder();
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Market Fail',
                            direction: 'Sell',
                            orderType: 'Market',
                            maxActive: isMaxModeEnabled,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            errorMessage: result.error || 'Transaction failed',
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                // Show error notification
                notifications.add({
                    title: 'Sell Order Failed',
                    message: result.error || 'Transaction failed',
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
            }
        } catch (error) {
            notifications.remove(slug);
            console.error('❌ Error submitting market sell order:', error);
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        version: packageJson.version,
                        actionType: 'Market Fail',
                        direction: 'Sell',
                        orderType: 'Market',
                        maxActive: isMaxModeEnabled,
                        skipConfirm: activeOptions.skipOpenOrderConfirm,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                    },
                });
            }
            notifications.add({
                title: 'Sell Order Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
                removeAfter: 10000,
            });
        } finally {
            setIsProcessingOrder(false);
            confirmOrderModal.close();
        }
    }

    // fn to submit a 'Buy' limit order
    async function submitLimitBuy(): Promise<void> {
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

        // Validate price
        const limitPrice = parseFormattedNum(price);
        if (!limitPrice || limitPrice <= 0) {
            notifications.add({
                title: 'Invalid Price',
                message: 'Please enter a valid limit price',
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        setIsProcessingOrder(true);
        const slug = makeSlug(10);

        const usdValueOfOrderStr = formatNum(
            Math.round(notionalSymbolQtyNum * (markPx || 1) * 100) / 100,
            2,
            true,
            true,
        );

        if (activeOptions.skipOpenOrderConfirm) {
            confirmOrderModal.close();
            notifications.add({
                title: 'Buy / Long Limit Order Pending',
                message: `Placing limit order for ${usdValueOfOrderStr} of ${symbol} at ${formatNum(limitPrice, limitPrice > 10_000 ? 0 : 2, true, true)}`,
                icon: 'spinner',
                slug,
                removeAfter: 60000,
            });
        }

        const timeOfTxBuildStart = Date.now();
        try {
            // Execute limit order
            const result = await executeLimitOrder({
                quantity: notionalSymbolQtyNum,
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
                            version: packageJson.version,
                            actionType: 'Limit Success',
                            orderType: 'Limit',
                            direction: 'Buy',
                            maxActive: isMaxModeEnabled,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                notifications.add({
                    title: 'Buy / Long Limit Order Placed',
                    message: `Successfully placed buy order for ${usdValueOfOrderStr} of ${symbol} at ${formatNum(limitPrice, limitPrice > 10_000 ? 0 : 2, true, true)}`,
                    icon: 'check',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                    removeAfter: 5000,
                });
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Limit Fail',
                            orderType: 'Limit',
                            direction: 'Buy',
                            maxActive: isMaxModeEnabled,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            errorMessage:
                                result.error || 'Failed to place limit order',
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                notifications.add({
                    title: 'Limit Order Failed',
                    message: result.error || 'Failed to place limit order',
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
            }
        } catch (error) {
            notifications.remove(slug);
            console.error('❌ Error submitting limit buy order:', error);
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        version: packageJson.version,
                        actionType: 'Limit Fail',
                        orderType: 'Limit',
                        direction: 'Buy',
                        maxActive: isMaxModeEnabled,
                        skipConfirm: activeOptions.skipOpenOrderConfirm,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                    },
                });
            }
            notifications.add({
                title: 'Limit Order Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
                removeAfter: 10000,
            });
        } finally {
            setIsProcessingOrder(false);
            confirmOrderModal.close();
        }
    }

    // fn to submit a 'Sell' limit order
    async function submitLimitSell(): Promise<void> {
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

        // Validate price
        const limitPrice = parseFormattedNum(price);
        if (!limitPrice || limitPrice <= 0) {
            notifications.add({
                title: 'Invalid Price',
                message: 'Please enter a valid limit price',
                icon: 'error',
            });
            confirmOrderModal.close();
            return;
        }

        setIsProcessingOrder(true);

        const usdValueOfOrderStr = formatNum(
            Math.round(notionalSymbolQtyNum * (markPx || 1) * 100) / 100,
            2,
            true,
            true,
        );
        const slug = makeSlug(10);

        if (activeOptions.skipOpenOrderConfirm) {
            confirmOrderModal.close();
            notifications.add({
                title: 'Sell / Short Limit Order Pending',
                message: `Placing limit order for ${usdValueOfOrderStr} of ${symbol} at ${formatNum(limitPrice)}`,
                icon: 'spinner',
                slug,
                removeAfter: 60000,
            });
        }

        const timeOfTxBuildStart = Date.now();
        try {
            // Execute limit order
            const result = await executeLimitOrder({
                quantity: notionalSymbolQtyNum,
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
                            version: packageJson.version,
                            actionType: 'Limit Success',
                            orderType: 'Limit',
                            direction: 'Sell',
                            maxActive: isMaxModeEnabled,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                notifications.add({
                    title: 'Sell / Short Limit Order Placed',
                    message: `Successfully placed sell order for ${usdValueOfOrderStr} of ${symbol} at ${formatNum(limitPrice, limitPrice > 10_000 ? 0 : 2, true, true)}`,
                    icon: 'check',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                    removeAfter: 5000,
                });
            } else {
                notifications.remove(slug);
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Limit Fail',
                            orderType: 'Limit',
                            direction: 'Sell',
                            maxActive: isMaxModeEnabled,
                            skipConfirm: activeOptions.skipOpenOrderConfirm,
                            errorMessage:
                                result.error || 'Failed to place limit order',
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                notifications.add({
                    title: 'Limit Order Failed',
                    message: result.error || 'Failed to place limit order',
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
            }
        } catch (error) {
            notifications.remove(slug);
            console.error('❌ Error submitting limit sell order:', error);
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        version: packageJson.version,
                        actionType: 'Limit Fail',
                        orderType: 'Limit',
                        direction: 'Sell',
                        maxActive: isMaxModeEnabled,
                        skipConfirm: activeOptions.skipOpenOrderConfirm,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                    },
                });
            }
            notifications.add({
                title: 'Limit Order Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
                removeAfter: 10000,
            });
        } finally {
            setIsProcessingOrder(false);
            confirmOrderModal.close();
        }
    }

    // logic to dispatch a notification on demand
    const notifications: NotificationStoreIF = useNotificationStore();

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
        return (
            isReduceOnlyEnabled &&
            !!marginBucket &&
            (!marginBucket.netPosition ||
                (marginBucket.netPosition > 0n &&
                    tradeDirection === 'sell' &&
                    BigInt(Math.floor(notionalSymbolQtyNum * 1e8)) >
                        marginBucket.netPosition) ||
                (marginBucket.netPosition < 0n &&
                    tradeDirection === 'buy' &&
                    BigInt(Math.floor(notionalSymbolQtyNum * 1e8)) >
                        -1n * marginBucket.netPosition))
        );
    }, [
        isReduceOnlyEnabled,
        marginBucket,
        tradeDirection,
        notionalSymbolQtyNum,
    ]);

    const isDisabled =
        collateralInsufficientDebounced ||
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

            const isSubmitButtonFocused =
                document.activeElement === submitButton;
            // Submit if either:
            // 1. The submit button is focused, or
            // 2. Skip confirmation is not enabled
            if (
                (isSubmitButtonFocused ||
                    (!activeOptions.skipOpenOrderConfirm && isFocused)) &&
                notionalSymbolQtyNum &&
                !confirmOrderModal.isOpen &&
                !isAnyPortfolioModalOpen &&
                !isDisabled
            ) {
                handleSubmitOrder();
            } else if (
                activeOptions.skipOpenOrderConfirm &&
                isFocused &&
                submitButton
            ) {
                // focus the submit button
                (submitButton as HTMLElement).focus();
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
        notionalSymbolQtyNum,
        isFocused,
        isDisabled,
    ]);

    const getDisabledReason = (
        collateralInsufficientDebounced: boolean,
        sizeLessThanMinimum: boolean,
        sizeMoreThanMaximum: boolean,
        isPriceInvalid: boolean,
        isMarketOrderLoading: boolean,
        isReduceInWrongDirection: boolean,
        isReduceOnlyExceedingPositionSize: boolean,
    ) => {
        if (isMarketOrderLoading) return 'Processing order...';
        if (isReduceInWrongDirection)
            return `Open position is ${tradeDirection === 'buy' ? 'long' : 'short'}, switch to ${tradeDirection === 'buy' ? 'sell' : 'buy'}`;
        if (collateralInsufficientDebounced) return 'Insufficient collateral';
        if (isReduceOnlyExceedingPositionSize)
            return 'Reduce only exceeds position size';
        if (sizeLessThanMinimum) return 'Order size below minimum';
        if (sizeMoreThanMaximum) return 'Order size exceeds position limits';
        if (isPriceInvalid) return 'Invalid price';
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
        collateralInsufficientDebounced,
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

    const submitButton = document.querySelector(
        '[data-testid="submit-order-button"]',
    );

    const submitButtonText =
        normalizedEquity < MIN_POSITION_USD_SIZE
            ? 'Deposit to Trade'
            : isReduceInWrongDirection
              ? 'Switch Direction to Reduce'
              : collateralInsufficientDebounced
                ? tradeDirection === 'buy'
                    ? 'Max Long - Deposit to Trade'
                    : 'Max Short - Deposit to Trade'
                : 'Submit';

    return (
        <div ref={orderInputRef} className={styles.order_input}>
            <AnimatePresence mode='wait'>
                {showLaunchpad ? (
                    <motion.div
                        key='launchpad'
                        className={styles.launchpad}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
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
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            key='orderinput'
                            className={styles.mainContent}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
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
                                    onClick={() =>
                                        confirmOrderModal.open('margin')
                                    }
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
                                        className={
                                            styles.inputDetailsDataContent
                                        }
                                    >
                                        <div
                                            className={styles.inputDetailsLabel}
                                        >
                                            <span>{data.label}</span>
                                            <Tooltip
                                                content={data?.tooltipLabel}
                                                position='right'
                                            >
                                                <LuCircleHelp size={12} />
                                            </Tooltip>
                                        </div>
                                        <span
                                            className={styles.inputDetailValue}
                                        >
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
                            <PositionSize
                                {...positionSliderPercentageValueProps}
                            />

                            {showPriceRangeComponent && (
                                <PriceRange {...priceRangeProps} />
                            )}
                            {marketOrderType === 'scale' &&
                                priceDistributionButtons}
                            {marketOrderType === 'twap' && <RunningTime />}

                            <ReduceAndProfitToggle
                                {...reduceAndProfitToggleProps}
                            />
                        </motion.div>
                        <motion.div
                            key='buttondetails'
                            className={styles.button_details_container}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                            {isUserLoggedIn && (
                                <Tooltip
                                    content={disabledReason}
                                    position='top'
                                    disabled={!isDisabled}
                                >
                                    <button
                                        data-testid='submit-order-button'
                                        className={`${styles.submit_button}`}
                                        style={{
                                            backgroundColor:
                                                tradeDirection === 'buy'
                                                    ? buyColor
                                                    : sellColor,
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
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {confirmOrderModal.isOpen && (
                <Modal
                    close={confirmOrderModal.close}
                    title={
                        confirmOrderModal.content === 'margin'
                            ? 'Margin Mode'
                            : confirmOrderModal.content === 'scale'
                              ? 'Scale Options'
                              : confirmOrderModal.content === 'market_buy'
                                ? 'Confirm Buy Order'
                                : confirmOrderModal.content === 'market_sell'
                                  ? 'Confirm Sell Order'
                                  : confirmOrderModal.content === 'limit_buy'
                                    ? 'Confirm Limit Buy Order'
                                    : confirmOrderModal.content === 'limit_sell'
                                      ? 'Confirm Limit Sell Order'
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
                                    notionalSymbolQtyNum,
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
                                    notionalSymbolQtyNum,
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
                                    notionalSymbolQtyNum,
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
                                    notionalSymbolQtyNum,
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
