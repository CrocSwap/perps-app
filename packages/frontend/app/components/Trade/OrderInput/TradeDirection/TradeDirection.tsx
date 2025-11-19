import { motion } from 'framer-motion';
import React, { memo } from 'react';
import { useAppSettings } from '~/stores/AppSettingsStore';
import styles from './TradeDirection.module.css';
import type { OrderSide } from '~/utils/CommonIFs';
import { useTranslation } from 'react-i18next';

interface propsIF {
    tradeDirection: OrderSide;
    setTradeDirection: (direction: OrderSide) => void;
}

// In case of any bugs or issues with this component, please reach out to Jr.
function TradeDirection(props: propsIF) {
    const { tradeDirection, setTradeDirection } = props;

    const { t } = useTranslation();

    const { getBsColor } = useAppSettings();

    const disableButtons = false;

    const buyColor = getBsColor().buy;
    const sellColor = getBsColor().sell;

    const handleBuyClick = () => {
        setTradeDirection(tradeDirection === 'buy' ? 'sell' : 'buy');
    };

    const handleSellClick = () => {
        setTradeDirection(tradeDirection === 'buy' ? 'sell' : 'buy');
    };

    return (
        <div className={styles.trade_direction}>
            <div className={styles.buttons_wrapper}>
                {/* Animated background */}
                <motion.div
                    className={`${styles.toggle_background} ${
                        tradeDirection === 'buy'
                            ? styles.buy_active
                            : styles.sell_active
                    }`}
                    style={{
                        backgroundColor:
                            tradeDirection === 'buy' ? buyColor : sellColor,
                    }}
                    animate={{
                        x: tradeDirection === 'buy' ? '0%' : '100%',
                    }}
                    transition={{
                        duration: 0.3,
                        ease: [0.4, 0.0, 0.2, 1],
                    }}
                />

                {/* Buy Button */}
                <button
                    className={`${styles.toggle_button} ${
                        tradeDirection === 'buy' ? styles.active : ''
                    }`}
                    onClick={handleBuyClick}
                    disabled={disableButtons}
                >
                    {t('transactions.buyLong')}
                </button>

                {/* Sell Button */}
                <button
                    className={`${styles.toggle_button} ${
                        tradeDirection === 'sell' ? styles.active : ''
                    }`}
                    onClick={handleSellClick}
                    disabled={disableButtons}
                >
                    {t('transactions.sellShort')}
                </button>
            </div>
        </div>
    );
}

export default memo(TradeDirection);
