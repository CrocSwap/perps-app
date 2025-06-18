import { memo } from 'react';
import Modal from '~/components/Modal/Modal';
import PerformancePanel from '~/components/Portfolio/PerformancePanel/PerformancePanel';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import { useModal, type useModalIF } from '~/hooks/useModal';
import { feeSchedules, type feeTierIF } from '~/utils/feeSchedule';
import WebDataConsumer from '../trade/webdataconsumer';
import styles from './portfolio.module.css';
import { usePortfolioManager } from './usePortfolioManager';
import { usePortfolioModals } from './usePortfolioModals';
import SimpleButton from '~/components/SimpleButton/SimpleButton';

const MemoizedPerformancePanel = memo(PerformancePanel);

export function meta() {
    return [
        { title: 'Portfolio | Ambient' },
        { name: 'description', content: 'Trade Perps with Ambient' },
    ];
}

function Portfolio() {
    const { portfolio, formatCurrency } = usePortfolioManager();

    const {
        openDepositModal,
        openWithdrawModal,
        openSendModal,
        PortfolioModalsRenderer,
    } = usePortfolioModals();

    const feeScheduleModalCtrl: useModalIF = useModal('closed');

    return (
        <>
            <div className={styles.container}>
                <WebDataConsumer />
                <header>Portfolio</header>
                <div className={styles.column}>
                    <div className={styles.detailsContainer}>
                        <div className={styles.detailsContent}>
                            <h6>14 Day Volume</h6>
                            <h3>
                                {formatCurrency(
                                    portfolio.tradingVolume.biWeekly,
                                )}
                            </h3>
                            <div
                                className={styles.view_detail_clickable}
                                onClick={() => console.log('viewing volume')}
                            >
                                View volume
                            </div>
                        </div>
                        <div className={styles.detailsContent}>
                            <h6>Fees (Taker / Maker)</h6>
                            <h3>
                                {portfolio.fees.taker}% / {portfolio.fees.maker}
                                %
                            </h3>
                            <div
                                className={styles.view_detail_clickable}
                                style={{ visibility: 'hidden' }}
                                onClick={feeScheduleModalCtrl.open}
                            >
                                View fee schedule
                            </div>
                        </div>
                        <div
                            className={`${styles.detailsContent} ${styles.netValueMobile}`}
                        >
                            <h6>Total Net USD Value</h6>
                            <h3>{formatCurrency(portfolio.totalValueUSD)}</h3>
                        </div>
                        <div className={styles.totalNetDisplay}>
                            <h6>
                                <span>Total Net USD Value:</span>{' '}
                                {formatCurrency(portfolio.totalValueUSD)}
                            </h6>
                            <div className={styles.buttonContainer}>
                                <div className={styles.rowButton}>
                                    <SimpleButton
                                        onClick={openDepositModal}
                                        bg='accent1'
                                    >
                                        Deposit
                                    </SimpleButton>
                                    <SimpleButton
                                        onClick={openWithdrawModal}
                                        bg='dark3'
                                        hoverBg='accent1'
                                    >
                                        Withdraw
                                    </SimpleButton>
                                    <SimpleButton
                                        onClick={openSendModal}
                                        className={styles.sendMobile}
                                        bg='dark3'
                                        hoverBg='accent1'
                                    >
                                        Send
                                    </SimpleButton>
                                </div>
                                <SimpleButton
                                    onClick={openSendModal}
                                    className={styles.sendDesktop}
                                    bg='dark3'
                                    hoverBg='accent1'
                                >
                                    Send
                                </SimpleButton>
                            </div>
                        </div>
                    </div>

                    <section className={styles.mainContent}>
                        <MemoizedPerformancePanel />

                        <div className={styles.table}>
                            <TradeTable portfolioPage />
                        </div>
                    </section>
                </div>
            </div>

            {PortfolioModalsRenderer}

            {feeScheduleModalCtrl.isOpen && (
                <Modal
                    close={feeScheduleModalCtrl.close}
                    title={'Fee Schedule'}
                >
                    <div className={styles.fee_schedule_modal}>
                        <section className={styles.fee_table}>
                            <h4>VIP Tiers</h4>
                            <header>
                                <div>Tier</div>
                                <div>14D Volume</div>
                                <div>Taker</div>
                                <div>Maker</div>
                            </header>
                            <ol>
                                {feeSchedules.vip.map((feeTier: feeTierIF) => (
                                    <li key={JSON.stringify(feeTier)}>
                                        <div>{feeTier.tier}</div>
                                        <div>{feeTier.volume14d}</div>
                                        <div>{feeTier.taker}</div>
                                        <div>{feeTier.maker}</div>
                                    </li>
                                ))}
                            </ol>
                        </section>
                        <section className={styles.fee_table}>
                            <h4>Market Maker Tiers</h4>
                            <header>
                                <div>Tier</div>
                                <div>14D Volume</div>
                                <div />
                                <div>Maker</div>
                            </header>
                            <ol>
                                {feeSchedules.marketMaker.map(
                                    (feeTier: feeTierIF) => (
                                        <li key={JSON.stringify(feeTier)}>
                                            <div>{feeTier.tier}</div>
                                            <div>{feeTier.volume14d}</div>
                                            <div>{feeTier.taker}</div>
                                            <div>{feeTier.maker}</div>
                                        </li>
                                    ),
                                )}
                            </ol>
                        </section>
                        <div className={styles.neg_fees}>
                            Negative fees are rebates
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default memo(Portfolio);
