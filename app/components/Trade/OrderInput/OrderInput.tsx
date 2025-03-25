import { useState } from 'react';
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
import PriceDistribution from './PriceDistribution/PriceDistribution';
import RunningTime from './RunningTime/RunningTime';

export interface OrderTypeOption {
    value: string;
    label: string;
}

const marketOrderTypes: OrderTypeOption[] = [
    { value: 'market', label: 'Market' },
    { value: 'limit', label: 'Limit' },
    { value: 'scale', label: 'Scale' },
    { value: 'stop_limit', label: 'Stop Limit' },
    { value: 'stop_market', label: 'Stop Market' },
    { value: 'twap', label: 'TWAP' },
    { value: 'chase_limit', label: 'Chase Limit' },
];
const isolatedOrderTypes: OrderTypeOption[] = [
    { value: 'isolated', label: 'Isolated' },
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
    const [isolatedOrderType, setIsolatedOrderType] =
        useState<string>('isolated');
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
    const [priceRangeMin, setPriceRangeMin] = useState('');
    const [priceRangeMax, setPriceRangeMax] = useState('');
    const [priceRangeTotalOrders, setPriceRangeTotalOrders] = useState('');

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
            value: '0.000 ETH',
        },
    ];

    const handleMarketOrderTypeChange = (value: string) => {
        setMarketOrderType(value);
        console.log(`Order type changed to: ${value}`);
    };
    const handleIsolatedOrderTypeChange = (value: string) => {
        setIsolatedOrderType(value);
        console.log(`isolated type changed to: ${value}`);
    };
    const handleLeverageChange = (value: number) => {
        setLeverage(value);
        console.log(`Leverage changed to: ${value}x`);
    };

    // SIZE INPUT-----------------------------
    const handleSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSize(event.target.value);
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
    const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(event.target.value);
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
        if (/^\d*$/.test(value) && value.length <= 12) {
            setPriceRangeMin(value);
        }
    };

    const handleMaxPriceRange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value = event.target.value;
        if (/^\d*$/.test(value) && value.length <= 12) {
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
    // ------------------------------------END OF PROPS-----------------------------
    return (
        <div className={styles.mainContainer}>
            <div className={styles.mainContent}>
                <div className={styles.orderTypeDropdownContainer}>
                    <OrderDropdown
                        options={marketOrderTypes}
                        value={marketOrderType}
                        onChange={handleMarketOrderTypeChange}
                    />
                    <OrderDropdown
                        options={isolatedOrderTypes}
                        value={isolatedOrderType}
                        onChange={handleIsolatedOrderTypeChange}
                    />
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
                {marketOrderType === 'scale' && <PriceDistribution />}
                {marketOrderType === 'twap' && <RunningTime />}

                <ReduceAndProfitToggle {...reduceAndProfitToggleProps} />
            </div>

            <PlaceOrderButtons orderMarketPrice={marketOrderType} />
        </div>
    );
}
