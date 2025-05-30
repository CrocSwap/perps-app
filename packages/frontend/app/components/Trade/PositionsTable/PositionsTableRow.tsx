import { RiExternalLinkLine } from 'react-icons/ri';
import ShareModal from '~/components/ShareModal/ShareModal';
import { type useModalIF, useModal } from '~/hooks/useModal';
import { useNumFormatter } from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { PositionIF } from '~/utils/UserDataIFs';
import styles from './PositionsTable.module.css';
import { LuPen } from 'react-icons/lu';
import { useState } from 'react';
import Modal from '~/components/Modal/Modal';
import TakeProfitsModal from '../TakeProfitsModal/TakeProfitsModal';

interface PositionsTableRowProps {
    position: PositionIF;
    openTPModal: () => void;
    closeTPModal: () => void;
}

export default function PositionsTableRow(props: PositionsTableRowProps) {
    const { position } = props;
    const { coinPriceMap } = useTradeDataStore();
    const { formatNum } = useNumFormatter();
    const { getBsColor } = useAppSettings();

    const modalCtrl: useModalIF = useModal('closed');
    const [modalContent, setModalContent] = useState<string>('share');

    const getTpSl = () => {
        let ret = '';
        if (position.tp && position.tp > 0) {
            ret = `${formatNum(position.tp)}`;
        } else {
            ret = '--';
        }

        if (position.sl && position.sl > 0) {
            ret = `${ret} / ${formatNum(position.sl)}`;
        } else {
            ret = `${ret} / --`;
        }
        return ret;
    };
    const { buy, sell } = getBsColor();
    const baseColor = position.szi >= 0 ? buy : sell;
    function hexToRgba(hex: string, alpha: number): string {
        const [r, g, b] = hex
            .replace('#', '')
            .match(/.{2}/g)!
            .map((x) => parseInt(x, 16));
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const gradientStyle = {
        background: `linear-gradient(
          to right,
          ${hexToRgba(baseColor, 0.8)} 0%,
          ${hexToRgba(baseColor, 0.5)} 1%,
          ${hexToRgba(baseColor, 0.2)} 2%,
          ${hexToRgba(baseColor, 0)} 4%,
          transparent 100%
        )`,
        paddingLeft: '8px',
        borderLeft: `1px solid ${baseColor}`,
    };
    const openShareModal = () => {
        setModalContent('share');
        modalCtrl.open();
    };

    const openTpSlModal = () => {
        setModalContent('tpsl');
        modalCtrl.open();
    };

    const renderModalContent = () => {
        if (modalContent === 'share') {
            return <ShareModal close={modalCtrl.close} position={position} />;
        } else if (modalContent === 'tpsl') {
            return (
                <Modal close={modalCtrl.close} title='TP/SL for Position'>
                    <TakeProfitsModal
                        closeTPModal={modalCtrl.close}
                        position={position}
                    />
                </Modal>
            );
        }
        return null;
    };

    return (
        <div className={styles.rowContainer}>
            <div
                className={`${styles.cell} ${styles.coinCell}`}
                style={gradientStyle}
            >
                <span style={{ color: baseColor }}>{position.coin}</span>
                {position.leverage.value && (
                    <span
                        className={styles.badge}
                        style={{
                            color: baseColor,
                            backgroundColor: hexToRgba(baseColor, 0.15),
                        }}
                    >
                        {position.leverage.value}x
                    </span>
                )}
            </div>
            <div
                className={`${styles.cell} ${styles.sizeCell}`}
                style={{
                    color:
                        position.szi >= 0
                            ? getBsColor().buy
                            : getBsColor().sell,
                }}
            >
                {Math.abs(position.szi)} {position.coin}
            </div>
            <div className={`${styles.cell} ${styles.positionValueCell}`}>
                {formatNum(position.positionValue, null, true, true)}
            </div>
            <div className={`${styles.cell} ${styles.entryPriceCell}`}>
                {formatNum(position.entryPx)}
            </div>
            <div className={`${styles.cell} ${styles.markPriceCell}`}>
                {formatNum(coinPriceMap.get(position.coin) ?? 0)}
            </div>
            <div
                onClick={openShareModal}
                className={`${styles.cell} ${styles.pnlCell}`}
                style={{
                    color:
                        position.unrealizedPnl > 0
                            ? getBsColor().buy
                            : position.unrealizedPnl < 0
                              ? getBsColor().sell
                              : 'var(--text2)',
                }}
            >
                {formatNum(position.unrealizedPnl, 2, true, true, true)} (
                {formatNum(
                    position.returnOnEquity * 100,
                    1,
                    false,
                    false,
                    true,
                )}
                %)
                <RiExternalLinkLine color='var(--text2)' />
            </div>
            <div className={`${styles.cell} ${styles.liqPriceCell}`}>
                {formatNum(position.liquidationPx)}
            </div>
            <div className={`${styles.cell} ${styles.marginCell}`}>
                {formatNum(position.marginUsed, 2)}
            </div>
            <div
                className={`${styles.cell} ${styles.fundingCell}`}
                style={{
                    color:
                        position.cumFunding.allTime > 0
                            ? getBsColor().buy
                            : position.cumFunding.allTime < 0
                              ? getBsColor().sell
                              : 'var(--text2)',
                }}
            >
                {formatNum(position.cumFunding.allTime, 2, true, true, true)}
            </div>
            <div className={`${styles.cell} ${styles.tpslCell}`}>
                {getTpSl()}
                <button onClick={openTpSlModal}>
                    <LuPen color='var(--text1)' size={10} />
                </button>
            </div>
            <div className={`${styles.cell} ${styles.closeCell}`}>
                <div className={styles.actionContainer}>
                    <button className={styles.actionButton}>Limit</button>
                    <button className={styles.actionButton}>Market</button>
                </div>
            </div>
            {modalCtrl.isOpen && renderModalContent()}
        </div>
    );
}
