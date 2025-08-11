import { useEffect, useMemo } from 'react';
import { LuCircleHelp } from 'react-icons/lu';
import Tooltip from '~/components/Tooltip/Tooltip';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import type { modalContentT } from '../OrderInput';
import styles from './ConfirmationModal.module.css';

interface propsIF {
    tx: modalContentT;
    submitFn: () => void;
    size: {
        qty: string;
        denom: string;
    };
    limitPrice?: string;
    isEnabled: boolean;
    toggleEnabled: () => void;
    isProcessing?: boolean;
    setIsProcessingOrder?: (value: boolean) => void;
    liquidationPrice?: number | null;
    usdOrderValue?: number;
}
type InfoItem = {
    label: string;
    value: string;
    tooltip?: string;
    className?: string;
    valueStyle?: React.CSSProperties;
};

export default function ConfirmationModal(props: propsIF) {
    const {
        submitFn,
        tx,
        isEnabled,
        toggleEnabled,
        size,
        limitPrice,
        isProcessing,
        setIsProcessingOrder,
        liquidationPrice,
        usdOrderValue,
    } = props;

    const { getBsColor } = useAppSettings();

    const { formatNum } = useNumFormatter();

    const buyColor = getBsColor().buy;
    const sellColor = getBsColor().sell;

    useEffect(() => {
        if (isProcessing) {
            setIsProcessingOrder?.(false);
        }
    }, []);

    // hook to handle Enter key press for order submission
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                submitFn();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [submitFn]);

    const liquidationPriceDisplay = useMemo(() => {
        if (liquidationPrice === null || liquidationPrice === undefined) {
            return '-';
        }

        const humanReadablePrice = liquidationPrice / 1e6; // Convert from 10^8 to human readable

        // Display '-' if price is below 0 or above 100 million
        if (humanReadablePrice <= 0 || humanReadablePrice > 100_000_000) {
            return '-';
        }

        return formatNum(
            humanReadablePrice,
            null,
            true,
            true,
            false,
            false,
            0,
            true,
        );
    }, [liquidationPrice, formatNum]);

    const dataInfo: InfoItem[] = [
        {
            label: 'Action',
            value: tx.includes('buy') ? 'Buy' : 'Sell',
            valueStyle: {
                color: tx.includes('buy')
                    ? getBsColor().buy
                    : getBsColor().sell,
            },
        },
        {
            label: 'Size',
            value: `${size.qty || '--'} ${size.denom}`,
            valueStyle: {
                color: tx.includes('buy')
                    ? getBsColor().buy
                    : getBsColor().sell,
            },
        },
        {
            label: 'Order Value',
            value: usdOrderValue
                ? formatNum(usdOrderValue, null, true, true)
                : '-',
            valueStyle: {
                color: tx.includes('buy')
                    ? getBsColor().buy
                    : getBsColor().sell,
            },
        },
        {
            label: 'Price',
            value: tx.includes('limit') ? limitPrice || '--' : 'Market',
            className: styles.white,
        },
        {
            label: 'Est. Liquidation Price',
            value: liquidationPriceDisplay,
            tooltip:
                'Estimated price at which your position will be liquidated',
            className: styles.white,
        },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.contentContainer}>
                {dataInfo.map((info) => (
                    <div className={styles.infoRow}>
                        <div className={styles.infoLabel}>
                            {info.label}
                            {info?.tooltip && (
                                <Tooltip
                                    content={info?.tooltip}
                                    position='right'
                                >
                                    <LuCircleHelp size={12} />
                                </Tooltip>
                            )}
                        </div>
                        <div
                            className={`${styles.infoValue} ${
                                info?.className && info.className
                            }`}
                            style={{
                                ...info?.valueStyle,
                            }}
                        >
                            {info.value}
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.toggleContainer}>
                <ToggleSwitch
                    isOn={!isEnabled}
                    onToggle={toggleEnabled}
                    label={"Don't show this again"}
                    // reverse
                />
            </div>
            <button
                className={styles.confirmButton}
                onClick={isProcessing ? undefined : submitFn}
                style={{
                    height: '47px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    backgroundColor: tx.includes('buy') ? buyColor : sellColor,
                }}
                disabled={isProcessing}
            >
                {isProcessing
                    ? 'Confirming Transaction...'
                    : tx.includes('buy')
                      ? 'Buy / Long'
                      : 'Sell / Short'}
            </button>
        </div>
    );
}
