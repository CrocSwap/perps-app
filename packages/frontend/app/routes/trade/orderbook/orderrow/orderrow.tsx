import { useMemo } from 'react';
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
}) => {
    const { setTradeSlot } = useTradeModuleStore();

    const formattedPrice = useMemo(() => {
        return formatNum(order.px, resolution);
    }, [order.px, resolution]);

    const handleClick = () => {
        setTradeSlot({
            coin: order.coin,
            amount: order.sz,
            price: order.px,
            type: order.type,
        });

        // Use setTimeout to ensure the DOM has updated with the new trade slot
        setTimeout(() => {
            // Find the size input element
            const sizeInput = document.getElementById(
                'trade-module-size-input',
            ) as HTMLInputElement;
            // Find the submit button
            const submitButton = document.querySelector(
                '[data-testid="submit-order-button"]',
            ) as HTMLButtonElement;

            if (sizeInput && submitButton) {
                if (!sizeInput.value) {
                    // If size input is empty, focus it
                    sizeInput.focus();
                } else {
                    // Otherwise, focus the submit button
                    submitButton.focus();
                }
            }
        }, 0);
    };
    return (
        <div
            id={`order-row-${order.px}`}
            className={`${styles.orderRow} ${userSlots.has(formattedPrice) ? styles.userOrder : ''}`}
            onClick={handleClick}
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
                onClick={() =>
                    clickListener(order, OrderRowClickTypes.PRICE, rowIndex)
                }
            >
                {formattedPrice}
            </div>
            <div
                className={styles.orderRowSize}
                onClick={() =>
                    clickListener(order, OrderRowClickTypes.AMOUNT, rowIndex)
                }
            >
                {formatNum(order.sz * coef)}
            </div>
            <div
                className={styles.orderRowTotal}
                onClick={() =>
                    clickListener(order, OrderRowClickTypes.AMOUNT, rowIndex)
                }
            >
                {formatNum(order.total * coef)}
            </div>
            {/* <div className={styles.fadeOverlay}></div> */}
        </div>
    );
};

export default OrderRow;
