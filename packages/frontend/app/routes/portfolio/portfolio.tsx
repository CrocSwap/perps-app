import { memo } from 'react';
import type { Route } from '../../+types/root';
import TradeTable from '~/components/Trade/TradeTables/TradeTables';
import styles from './portfolio.module.css';
import { Link } from 'react-router';
import PerformancePanel from '~/components/Portfolio/PerformancePanel/PerformancePanel';
import Modal from '~/components/Modal/Modal';
import { lazy, Suspense } from 'react';
import { usePortfolioManager } from './usePortfolioManager';
import { useModal, type useModalIF } from '~/hooks/useModal';
import { MdOutlineClose } from 'react-icons/md';
import { feeSchedules, type feeTierIF } from '~/utils/feeSchedule';

const PortfolioDeposit = lazy(
    () => import('~/components/Portfolio/PortfolioDeposit/PortfolioDeposit'),
);
const PortfolioWithdraw = lazy(
    () => import('~/components/Portfolio/PortfolioWithdraw/PortfolioWithdraw'),
);
const PortfolioSend = lazy(
    () => import('~/components/Portfolio/PortfolioSend/PortfolioSend'),
);

const MemoizedPerformancePanel = memo(PerformancePanel);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function meta(args: Route.MetaArgs) {
    return [
        { title: 'Perps - Portfolio' },
        { name: 'description', content: 'Welcome to React Router!' },
    ];
}

export function loader({ context }: Route.LoaderArgs) {
    return { message: context.VALUE_FROM_NETLIFY };
}



interface volHistoryIF {
    date: string;
    exchVol: string;
    makerVol: string;
    takerVol: string;
}

function makeVolData(n: number): volHistoryIF[] {
    function makeNum(min: number, max: number, digits?: number): string {
        if (min > max) {
            [min, max] = [max, min];
        }
        min = Math.ceil(min);
        max = Math.floor(max);
        const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
        if (digits !== undefined) {
            const paddingLength = Math.abs(digits).toString().length;
            return randomInt.toString().padStart(paddingLength, '0');
        }
        return randomInt.toString();
    }
    function makeDatum(): volHistoryIF {
        const output: volHistoryIF = {
            date: '',
            exchVol: '',
            makerVol: '',
            takerVol: '',
        }
        output.date = `${makeNum(2024, 2025)}-${makeNum(1, 12, 2)}-${makeNum(1, 28, 2)}`;
        output.exchVol = `$${makeNum(0, 999)},${makeNum(0, 999, 3)},${makeNum(0, 999, 3)},${makeNum(0, 999, 3)}.${makeNum(0, 99, 2)}`;
        output.makerVol = `$${makeNum(0, 1)}.${makeNum(0, 99, 2)}`;
        output.takerVol = `$${makeNum(0, 1)}.${makeNum(0, 99, 2)}`;
        return output;
    }
    return Array.from({ length: n }, () => makeDatum())
        .sort(
            (a, b) => parseInt(b.date) - parseInt(a.date)
        );
}

function Portfolio() {
    const {
        portfolio,
        selectedPortfolio,
        isProcessing,
        modalState,
        formatCurrency,
        openModal,
        closeModal,
        processDeposit,
        processWithdraw,
        processSend,
    } = usePortfolioManager();

    // logic to open and close the fee schedule modal
    const feeScheduleModalCtrl: useModalIF = useModal('closed');

    // logic to open and close the volume history modal
    const volumeHistoryModalCtrl: useModalIF = useModal('closed');

    return (
        <>
            <div className={styles.container}>
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
                                onClick={volumeHistoryModalCtrl.open}>
                                View volume
                            </div>
                        </div>
                        <div className={styles.detailsContent}>
                            <h6>Fees (Taker / Maker)</h6>
                            <h3>
                                {portfolio.fees.taker}% / {portfolio.fees.maker}
                                %
                            </h3>
                            {/* <Link to='/'>View fee schedule</Link> */}
                            <div
                                className={styles.view_detail_clickable}
                                onClick={feeScheduleModalCtrl.open}>
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
                            <div className={styles.rowButton}>
                                <button onClick={() => openModal('deposit')}>
                                    Deposit
                                </button>
                                <button onClick={() => openModal('withdraw')}>
                                    Withdraw
                                </button>
                                <button
                                    onClick={() => openModal('send')}
                                    className={styles.sendMobile}
                                >
                                    Send
                                </button>
                            </div>
                            <button
                                onClick={() => openModal('send')}
                                className={styles.sendDesktop}
                            >
                                Send
                            </button>
                        </div>
                    </div>

                    <section className={styles.mainContent}>
                        <MemoizedPerformancePanel />

                        <div className={styles.table}>
                            <TradeTable />
                        </div>
                    </section>
                </div>
            </div>

            {modalState.isOpen && selectedPortfolio && (
                <Modal
                    close={closeModal}
                    position='center'
                    title={
                        modalState.content === 'deposit'
                            ? 'Deposit '
                            : modalState.content === 'withdraw'
                              ? 'Withdraw '
                              : modalState.content === 'send'
                                ? 'Send '
                                : ''
                    }
                >
                    <Suspense fallback={<div>Loading...</div>}>
                        {modalState.content === 'deposit' && (
                            <PortfolioDeposit
                                portfolio={{
                                    id: selectedPortfolio.id,
                                    name: selectedPortfolio.name,
                                    availableBalance:
                                        selectedPortfolio.availableBalance,
                                    unit: selectedPortfolio.unit,
                                }}
                                onDeposit={processDeposit}
                                onClose={closeModal}
                                isProcessing={isProcessing}
                            />
                        )}

                        {modalState.content === 'withdraw' && (
                            <PortfolioWithdraw
                                portfolio={{
                                    id: selectedPortfolio.id,
                                    name: selectedPortfolio.name,
                                    availableBalance:
                                        selectedPortfolio.availableBalance,
                                    unit: selectedPortfolio.unit,
                                }}
                                onWithdraw={processWithdraw}
                                onClose={closeModal}
                                isProcessing={isProcessing}
                            />
                        )}

                        {modalState.content === 'send' && (
                            <PortfolioSend
                                availableAmount={
                                    selectedPortfolio.availableBalance
                                }
                                tokenType={selectedPortfolio.unit}
                                networkFee={
                                    selectedPortfolio.unit === 'USD'
                                        ? '$0.001'
                                        : '0.0001 BTC'
                                }
                                onSend={processSend}
                                onClose={closeModal}
                                isProcessing={isProcessing}
                                portfolio={{
                                    id: selectedPortfolio.id,
                                    name: selectedPortfolio.name,
                                    availableBalance:
                                        selectedPortfolio.availableBalance,
                                    unit: selectedPortfolio.unit,
                                }}
                            />
                        )}
                    </Suspense>
                </Modal>
            )}
            { feeScheduleModalCtrl.isOpen &&
                <Modal title='Fee Schedule' close={feeScheduleModalCtrl.close}>
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
                                {
                                    feeSchedules.vip.map(
                                        (feeTier: feeTierIF) => (
                                            <li key={JSON.stringify(feeTier)}>
                                                <div>{feeTier.tier}</div>
                                                <div>{feeTier.volume14d}</div>
                                                <div>{feeTier.taker}</div>
                                                <div>{feeTier.maker}</div>
                                            </li>
                                        )
                                    )
                                }
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
                                {
                                    feeSchedules.marketMaker.map(
                                        (feeTier: feeTierIF) => (
                                            <li key={JSON.stringify(feeTier)}>
                                                <div>{feeTier.tier}</div>
                                                <div>{feeTier.volume14d}</div>
                                                <div>{feeTier.taker}</div>
                                                <div>{feeTier.maker}</div>
                                            </li>
                                        )
                                    )
                                }
                            </ol>
                        </section>
                        <div className={styles.neg_fees}>Negative fees are rebates</div>
                    </div>
                </Modal>
            }
            { volumeHistoryModalCtrl.isOpen &&
                <Modal title='Your Volume History' close={volumeHistoryModalCtrl.close}>
                    <div className={styles.fee_schedule_modal}>
                        <section className={styles.fee_table}>
                            <header>
                                <div>Tier</div>
                                <div>14D Volume</div>
                                <div>Taker</div>
                                <div>Maker</div>
                            </header>
                            <ol>
                                {
                                    makeVolData(8).map(
                                        (vol: volHistoryIF) => (
                                            <li key={JSON.stringify(vol)}>
                                                <div>{vol.date}</div>
                                                <div>{vol.exchVol}</div>
                                                <div>{vol.makerVol}</div>
                                                <div>{vol.takerVol}</div>
                                            </li>
                                        )
                                    )
                                }
                            </ol>
                        </section>
                        <div className={styles.neg_fees}>Dates are based on UTC time zones and do not include the current day.</div>
                        <div className={styles.neg_fees}>Your 14D maker volume share is 0.00%.</div>
                    </div>
                </Modal>
            }
        </>
    );
}

export default memo(Portfolio);
