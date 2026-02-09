import React, { useEffect, useCallback } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { useNumFormatter } from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { PositionIF } from '~/utils/UserDataIFs';
import styles from './PositionDetails.module.css';

interface PositionDetailsProps {
    position: PositionIF;
    isOpen: boolean;
    onClose: () => void;
    onMarketClose: () => void;
    onLimitClose: () => void;
    onShareClick: () => void;
    onTpSlClick: () => void;
    /** 'inline' for expanded row, 'sheet' for mobile bottom sheet */
    variant: 'inline' | 'sheet';
    /** Which columns are currently hidden (only used for inline variant) */
    hiddenColumns?: Set<string>;
}

const PositionDetails: React.FC<PositionDetailsProps> = ({
    position,
    isOpen,
    onClose,
    onMarketClose,
    onLimitClose,
    onShareClick,
    onTpSlClick,
    variant,
    hiddenColumns = new Set(),
}) => {
    const { t } = useTranslation();
    const { formatNum } = useNumFormatter();
    const { getBsColor } = useAppSettings();
    const { coinPriceMap } = useTradeDataStore();

    const baseColor = position.szi >= 0 ? getBsColor().buy : getBsColor().sell;
    const pnlColor =
        position.unrealizedPnl > 0
            ? getBsColor().buy
            : position.unrealizedPnl < 0
              ? getBsColor().sell
              : 'var(--text2)';

    const fundingValue = position.cumFunding.sinceOpen * -1;
    const fundingColor =
        fundingValue > 0
            ? getBsColor().buy
            : fundingValue < 0
              ? getBsColor().sell
              : 'var(--text2)';

    const liquidationDisp =
        position.liquidationPx === null
            ? '-'
            : position.liquidationPx <= 0
              ? '0'
              : position.liquidationPx > 1_000_000
                ? '>' + formatNum(1_000_000)
                : formatNum(position.liquidationPx);

    // Handle escape key and body scroll lock for sheet variant
    useEffect(() => {
        if (variant !== 'sheet') return;

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, variant]);

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        },
        [onClose],
    );

    // Build list of data items to display
    const buildDataItems = () => {
        const items: Array<{
            key: string;
            label: string;
            value: string;
            color?: string;
        }> = [];

        const showAll = variant === 'sheet';

        if (showAll || hiddenColumns.has('size')) {
            items.push({
                key: 'size',
                label: t('tradeTable.size'),
                value: `${Math.abs(position.szi)} ${position.coin}`,
                color: baseColor,
            });
        }

        if (showAll || hiddenColumns.has('positionValue')) {
            items.push({
                key: 'positionValue',
                label: t('tradeTable.positionValue'),
                value: formatNum(position.positionValue, null, true, true),
            });
        }

        if (showAll || hiddenColumns.has('entryPrice')) {
            items.push({
                key: 'entryPrice',
                label: t('tradeTable.entryPrice'),
                value: formatNum(position.entryPx),
            });
        }

        if (showAll || hiddenColumns.has('markPrice')) {
            items.push({
                key: 'markPrice',
                label: t('tradeTable.markPrice'),
                value: formatNum(coinPriceMap.get(position.coin) ?? 0),
            });
        }

        if (showAll || hiddenColumns.has('liqPrice')) {
            items.push({
                key: 'liqPrice',
                label: t('tradeTable.liqPrice'),
                value: liquidationDisp,
            });
        }

        if (showAll || hiddenColumns.has('margin')) {
            items.push({
                key: 'margin',
                label: t('tradeTable.margin'),
                value: formatNum(position.marginUsed, 2),
            });
        }

        if (showAll || hiddenColumns.has('funding')) {
            items.push({
                key: 'funding',
                label: t('tradeTable.funding'),
                value: formatNum(fundingValue, 2, true, true, true),
                color: fundingColor,
            });
        }

        if (
            (showAll || hiddenColumns.has('tpsl')) &&
            (position.tp || position.sl)
        ) {
            items.push({
                key: 'tpsl',
                label: 'TP/SL',
                value: `${position.tp ? formatNum(position.tp) : '--'} / ${position.sl ? formatNum(position.sl) : '--'}`,
            });
        }

        return items;
    };

    const dataItems = buildDataItems();

    if (!isOpen) return null;

    // ============ BOTTOM SHEET VARIANT ============
    if (variant === 'sheet') {
        return (
            <div className={styles.backdrop} onClick={handleBackdropClick}>
                <div className={styles.sheet} role='dialog' aria-modal='true'>
                    <div className={styles.handleBar} />

                    <div className={styles.sheetHeader}>
                        <div className={styles.titleRow}>
                            <div
                                className={styles.coinBadge}
                                style={{
                                    color: baseColor,
                                    borderColor: baseColor,
                                }}
                            >
                                <span className={styles.coinName}>
                                    {position.coin}
                                </span>
                                <span className={styles.leverageBadge}>
                                    {Math.floor(position.leverage.value)}x
                                </span>
                                <span className={styles.directionBadge}>
                                    {position.szi >= 0
                                        ? t('common.long')
                                        : t('common.short')}
                                </span>
                            </div>
                            <button
                                className={styles.closeButton}
                                onClick={onClose}
                            >
                                <RiCloseLine size={24} />
                            </button>
                        </div>

                        <div
                            className={styles.pnlHero}
                            style={{ color: pnlColor }}
                        >
                            <span className={styles.pnlValueLarge}>
                                {formatNum(
                                    position.unrealizedPnl,
                                    2,
                                    true,
                                    true,
                                    true,
                                )}
                            </span>
                            <span className={styles.pnlPercentLarge}>
                                (
                                {formatNum(
                                    position.returnOnEquity * 100,
                                    2,
                                    false,
                                    false,
                                    true,
                                )}
                                %)
                            </span>
                        </div>
                    </div>

                    <div className={styles.sheetGrid}>
                        {dataItems.map((item) => (
                            <div key={item.key} className={styles.gridItem}>
                                <span className={styles.gridLabel}>
                                    {item.label}
                                </span>
                                <span
                                    className={styles.gridValue}
                                    style={
                                        item.color
                                            ? { color: item.color }
                                            : undefined
                                    }
                                >
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.sheetActions}>
                        <button
                            className={styles.secondaryButton}
                            onClick={onShareClick}
                        >
                            {t('share.share')}
                        </button>
                        <button
                            className={styles.secondaryButton}
                            onClick={onTpSlClick}
                        >
                            {t('transactions.setTpSl')}
                        </button>
                    </div>

                    <div className={styles.sheetCloseActions}>
                        <button
                            className={styles.marketCloseButton}
                            onClick={onMarketClose}
                        >
                            {t('transactions.marketClose')}
                        </button>
                        <button
                            className={styles.limitCloseButton}
                            onClick={onLimitClose}
                        >
                            {t('transactions.limitClose')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ============ INLINE EXPANDED VARIANT - Compact single row ============
    return (
        <div className={styles.inlineContainer}>
            <div className={styles.inlineData}>
                {dataItems.map((item) => (
                    <div key={item.key} className={styles.inlineItem}>
                        <span className={styles.inlineLabel}>{item.label}</span>
                        <span
                            className={styles.inlineValue}
                            style={
                                item.color ? { color: item.color } : undefined
                            }
                        >
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            <div className={styles.inlineActions}>
                <button
                    className={styles.inlineActionBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onShareClick();
                    }}
                >
                    {t('share.share')}
                </button>
                <button
                    className={styles.inlineActionBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onTpSlClick();
                    }}
                >
                    {t('transactions.setTpSl')}
                </button>
                <span className={styles.actionDivider} />
                <button
                    className={styles.inlineCloseBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onMarketClose();
                    }}
                >
                    {t('transactions.marketClose')}
                </button>
                <button
                    className={styles.inlineLimitBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onLimitClose();
                    }}
                >
                    {t('transactions.limitClose')}
                </button>
            </div>
        </div>
    );
};

export default PositionDetails;
