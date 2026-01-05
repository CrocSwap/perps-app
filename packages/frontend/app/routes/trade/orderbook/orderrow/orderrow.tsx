import React, { useMemo } from 'react';
import { type colorSetIF } from '~/stores/AppSettingsStore';
import { useTradeModuleStore } from '~/stores/TradeModuleStore';
import type {
    OrderBookRowIF,
    OrderRowResolutionIF,
} from '~/utils/orderbook/OrderBookIFs';
import styles from './orderrow.module.css';

interface OrderRowProps {
    rowIndex: number;
    order: OrderBookRowIF;
    coef: number;
    resolution: OrderRowResolutionIF | null;
    userSlots: Set<string>;
    clickListener: (
        order: OrderBookRowIF,
        type: OrderRowClickTypes,
        rowIndex: number,
    ) => void;
    formatNum: (
        num: number | string,
        precision?: number | OrderRowResolutionIF | null,
        currencyConversion?: boolean,
        showDollarSign?: boolean,
        addPlusSignIfPositive?: boolean,
    ) => string;
    getBsColor: () => colorSetIF;
    obFocusedSlotPrice?: number;
}

export enum OrderRowClickTypes {
    PRICE = 'price',
    AMOUNT = 'amount',
}

const OrderRow: React.FC<OrderRowProps> = ({
    rowIndex,
    order,
    coef,
    resolution,
    userSlots,
    clickListener,
    formatNum,
    getBsColor,
    obFocusedSlotPrice,
}) => {
    const { setTradeSlot } = useTradeModuleStore();

    const formattedPrice = useMemo(() => {
        return formatNum(order.px, resolution);
    }, [order.px, resolution]);

    const handleRowClick = () => {
        setTradeSlot({
            coin: order.coin,
            amount: order.sz,
            price: order.px,
            type: order.type,
        });

        // Use requestAnimationFrame for better performance than setTimeout
        requestAnimationFrame(() => {
            const sizeInput = document.getElementById(
                'trade-module-size-input',
            ) as HTMLInputElement;
            const submitButton = document.querySelector(
                '[data-testid="submit-order-button"]',
            ) as HTMLButtonElement;

            if (sizeInput && submitButton) {
                if (!sizeInput.value) {
                    sizeInput.focus();
                } else {
                    submitButton.focus();
                }
            }
        });
    };
    const handlePriceClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        clickListener(order, OrderRowClickTypes.PRICE, rowIndex);
    };

    const handleAmountClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        clickListener(order, OrderRowClickTypes.AMOUNT, rowIndex);
    };

    return (
        <div
            id={`order-row-${order.px}`}
            className={`${styles.orderRow} ${userSlots.has(formattedPrice) ? styles.userOrder : ''} ${obFocusedSlotPrice === order.px ? styles.focused : ''}`}
            onClick={handleRowClick}
        >
            {userSlots.has(formattedPrice) && (
                <div className={styles.userOrderIndicator}></div>
            )}
            <div
                className={styles.orderRowPrice}
                style={{
                    color:
                        order.type === 'buy'
                            ? getBsColor().buy
                            : getBsColor().sell,
                }}
                onClick={handlePriceClick}
            >
                {formattedPrice}
            </div>
            <div className={styles.orderRowSize} onClick={handleAmountClick}>
                {formatNum(order.sz * coef)}
            </div>
            <div className={styles.orderRowTotal} onClick={handleAmountClick}>
                {formatNum(order.total * coef)}
            </div>
        </div>
    );
};

export default React.memo(OrderRow);
