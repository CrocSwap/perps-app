import React, { useState } from 'react';
import useScaleOrders, {
    type OrderRow,
    PRICE_DISTRIBUTION_TYPES,
    RATIO_DISTRIBUTION_TYPES,
} from './useScaleOrders';
import styles from './ScaleOrders.module.css';

import increasingPriceSvg from '../../../../assets/icons/IncreasingPrice.svg';
import decreasingPriceSvg from '../../../../assets/icons/DecreasingPrice.svg';
import flatPriceSvg from '../../../../assets/icons/FlatPriceDistribution.svg';
import evenRatioSvg from '../../../../assets/icons/EvenRatio.svg';
import decreasingRatioSvg from '../../../../assets/icons/DecreasingRatio.svg';
import increasingRatioSvg from '../../../../assets/icons/IncreasingRatio.svg';
import DistributionDropdown from './DistributionDropdown';

interface ScaleOrdersProps {
    minPrice: number;
    maxPrice: number;
    totalQuantity: number;
    onClose: () => void;
    onConfirm?: (orders: OrderRow[]) => void;
    isModal?: boolean;
}
type PriceDistributionType =
    (typeof PRICE_DISTRIBUTION_TYPES)[keyof typeof PRICE_DISTRIBUTION_TYPES];
type RatioDistributionType =
    (typeof RATIO_DISTRIBUTION_TYPES)[keyof typeof RATIO_DISTRIBUTION_TYPES];

// Distribution options data
const priceDistributionOptions: Array<{
    type: PriceDistributionType;
    label: string;
    icon: React.ReactNode;
    iconClassName: string;
}> = [
    {
        type: PRICE_DISTRIBUTION_TYPES.FLAT,
        label: 'Flat',
        icon: flatPriceSvg,
        iconClassName: styles.flatIcon,
    },
    {
        type: PRICE_DISTRIBUTION_TYPES.INCREASING,
        label: 'Increasing',
        icon: increasingPriceSvg,
        iconClassName: styles.increasingIcon,
    },
    {
        type: PRICE_DISTRIBUTION_TYPES.DECREASING,
        label: 'Decreasing',
        icon: decreasingPriceSvg,
        iconClassName: styles.decreasingIcon,
    },
];
const ratioDistributionOptions = [
    {
        type: RATIO_DISTRIBUTION_TYPES.EVENLY_SPLIT,
        label: 'Evenly Split',
        icon: evenRatioSvg,
        iconClassName: styles.flatIcon,
    },
    {
        type: RATIO_DISTRIBUTION_TYPES.INCREASING,
        label: 'Increasing',
        icon: increasingRatioSvg,
        iconClassName: styles.increasingIcon,
    },
    {
        type: RATIO_DISTRIBUTION_TYPES.DECREASING,
        label: 'Decreasing',
        icon: decreasingRatioSvg,
        iconClassName: styles.decreasingIcon,
    },
];
const totalOrderQuantityOptions = [2, 5, 10, 20];

export default function ScaleOrders({
    minPrice,
    maxPrice,
    totalQuantity,
    onClose,
    onConfirm,
    isModal = false,
}: ScaleOrdersProps) {
    const [totalOrders, setTotalOrders] = useState<number>(10);
    const [totalOrderInputValue, setTotalOrderInputValue] = useState(
        totalOrders.toString(),
    );

    const {
        orders,
        priceDistribution,
        setPriceDistribution,
        ratioDistribution,
        setRatioDistribution,
        isPriceDropdownOpen,
        setIsPriceDropdownOpen,
        isRatioDropdownOpen,
        setIsRatioDropdownOpen,
        isValidRatio,
        updateOrderRatio,
        updateOrderQuantity,
    } = useScaleOrders({
        minPrice,
        maxPrice,
        totalQuantity,
        totalOrders,
    });

    // Event Handlers
    const handleTotalOrderInputBlur = () => {
        const parsedValue = parseInt(totalOrderInputValue, 10);
        if (!isNaN(parsedValue)) {
            setTotalOrders(parsedValue);
            setTotalOrderInputValue(parsedValue.toString());
        } else {
            setTotalOrderInputValue(totalOrders.toString());
        }
    };

    const handleTotalOrderInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const newValue = e.target.value;
        if (/^\d*$/.test(newValue)) {
            setTotalOrderInputValue(newValue);
        }
    };

    const handleConfirm = () => {
        if (onConfirm && isValidRatio) {
            onConfirm(orders);
        }
        onClose();
    };

    const handlePriceDistributionChange = (type: PriceDistributionType) => {
        setPriceDistribution(type);
        setIsPriceDropdownOpen(false);
    };

    const handleRatioDistributionChange = (type: RatioDistributionType) => {
        setRatioDistribution(type);
        setIsRatioDropdownOpen(false);
    };

    return (
        <div
            className={styles.scaleOrdersContainer}
            style={{
                maxWidth: isModal ? '500px' : '100%',
                width: isModal ? '422.5px' : '100%',
            }}
        >
            <div className={styles.scaleOrdersContent}>
                <div className={styles.totalOrdersSection}>
                    <input
                        type='text'
                        value={totalOrderInputValue}
                        onChange={handleTotalOrderInputChange}
                        onBlur={handleTotalOrderInputBlur}
                        placeholder='Total Orders'
                        className={styles.totalOrdersInput}
                    />
                    <div className={styles.quantityButtons}>
                        {totalOrderQuantityOptions.map((value) => (
                            <button
                                key={value}
                                className={`${styles.quantityButton} ${
                                    totalOrders === value ? styles.active : ''
                                }`}
                                onClick={() => setTotalOrders(value)}
                            >
                                {value}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.tableHeader}>
                    <DistributionDropdown
                        label='Price'
                        tooltipContent='price tooltip'
                        options={priceDistributionOptions}
                        currentValue={priceDistribution}
                        isDropdownOpen={isPriceDropdownOpen}
                        setIsDropdownOpen={setIsPriceDropdownOpen}
                        onOptionSelect={handlePriceDistributionChange}
                        headerClassName={styles.priceHeader}
                    />

                    <DistributionDropdown
                        label='Ratio'
                        tooltipContent='ratio'
                        options={ratioDistributionOptions}
                        currentValue={ratioDistribution}
                        isDropdownOpen={isRatioDropdownOpen}
                        setIsDropdownOpen={setIsRatioDropdownOpen}
                        onOptionSelect={handleRatioDistributionChange}
                        headerClassName={styles.ratioHeader}
                    />

                    <div className={styles.quantityHeader}>Quantity</div>
                </div>

                <div className={styles.orderList}>
                    {orders.map((order, index) => (
                        <div key={index} className={styles.orderRow}>
                            <input
                                type='text'
                                className={styles.priceInput}
                                value={order.price}
                                readOnly
                            />

                            <div className={styles.ratioCell}>
                                <input
                                    type='text'
                                    className={`${styles.ratioInput} ${
                                        !isValidRatio ? styles.invalidInput : ''
                                    }`}
                                    value={order.ratio}
                                    onChange={(e) => {
                                        updateOrderRatio(index, e.target.value);
                                    }}
                                />
                                <span className={styles.percentSign}>%</span>
                            </div>

                            <input
                                type='text'
                                className={styles.quantityInput}
                                value={order.quantity}
                                onChange={(e) => {
                                    updateOrderQuantity(index, e.target.value);
                                }}
                            />
                        </div>
                    ))}
                </div>

                {!isValidRatio && (
                    <div className={styles.errorMessage}>
                        Sum of order ratios must be 100%
                    </div>
                )}
            </div>

            {isModal && (
                <div className={styles.actions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={styles.confirmButton}
                        disabled={!isValidRatio}
                        onClick={handleConfirm}
                    >
                        Confirm
                    </button>
                </div>
            )}
        </div>
    );
}
