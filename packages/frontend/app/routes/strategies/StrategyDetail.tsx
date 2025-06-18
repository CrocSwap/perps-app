import styles from './StrategyDetail.module.css';
import { useNavigate, useParams } from 'react-router';
import {
    useStrategiesStore,
    type strategyDecoratedIF,
    type useStrategiesStoreIF,
} from '~/stores/StrategiesStore';
import { type useModalIF, useModal } from '~/hooks/useModal';
import Modal from '~/components/Modal/Modal';
import { FaChevronLeft } from 'react-icons/fa';
import { FiCopy } from 'react-icons/fi';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import OrderHistory from '~/components/OrderHistory/OrderHistory';
import LineChart from '~/components/LineChart/LineChart';

export default function Strategies() {
    // hook to manage navigation actions from this page
    const navigate = useNavigate();

    // address of the strategy from URL params
    const { address } = useParams();

    // strategy data to populate in this page
    const strategies: useStrategiesStoreIF = useStrategiesStore();
    const strategy: strategyDecoratedIF | undefined = strategies.data.find(
        (s: strategyDecoratedIF) => s.address === address,
    );

    // logic to control the strategy removal modal
    const removeStratModalCtrl: useModalIF = useModal();

    const lineData = [
        { time: 1743446400000, value: 101.2 },
        { time: 1743532800000, value: 102.5 },
        { time: 1743619200000, value: 100.8 },
        { time: 1743705600000, value: 99.4 },
        { time: 1743792000000, value: 101.9 },
        { time: 1743878400000, value: 103.3 },
        { time: 1743964800000, value: 104.0 },
        { time: 1744051200000, value: 102.1 },
        { time: 1744137600000, value: 100.7 },
        { time: 1744224000000, value: 99.5 },
        { time: 1744310400000, value: 98.9 },
        { time: 1744396800000, value: 97.6 },
        { time: 1744483200000, value: 99.2 },
        { time: 1744569600000, value: 100.3 },
        { time: 1744656000000, value: 101.0 },
        { time: 1744742400000, value: 102.6 },
        { time: 1744828800000, value: 104.3 },
        { time: 1744915200000, value: 105.1 },
        { time: 1745001600000, value: 103.7 },
        { time: 1745088000000, value: 102.4 },
    ];

    return (
        <div className={styles.strategy_detail_page}>
            <div>
                <header>
                    <div className={styles.header_left}>
                        <div className={styles.back_and_title}>
                            <div onClick={() => navigate('/strategies')}>
                                <FaChevronLeft />
                            </div>
                            <h2>{strategy?.name ?? 'No Strategy Found'}</h2>
                        </div>
                        <div className={styles.address_clickable}>
                            <p>{strategy?.address}</p>
                            <div className={styles.copy_address}>
                                <FiCopy size={14} />
                            </div>
                        </div>
                    </div>
                    <div className={styles.header_right}>
                        <div>
                            Status: {strategy?.isPaused ? 'Paused' : 'Running'}
                        </div>
                        <SimpleButton
                            onClick={() =>
                                strategy &&
                                strategies.togglePause(strategy.address)
                            }
                        >
                            {strategy?.isPaused ? 'Unpause' : 'Pause'}
                        </SimpleButton>
                        <SimpleButton
                            onClick={() =>
                                navigate(`/strategies/${address}/edit`, {
                                    state: { strategy, address },
                                })
                            }
                        >
                            Edit
                        </SimpleButton>
                        <SimpleButton
                            onClick={() => console.log('Strategy Transfered!')}
                        >
                            Transfer
                        </SimpleButton>
                        <SimpleButton
                            onClick={() => removeStratModalCtrl.open()}
                        >
                            Remove
                        </SimpleButton>
                    </div>
                </header>
                <div className={styles.strategy_details}>
                    <div className={styles.strategy_details_table}>
                        <header>
                            <span>Parameters</span>
                        </header>
                        <section>
                            <div>
                                <div>Market</div>
                                <div>{strategy?.market ?? '-'}</div>
                            </div>
                            <div>
                                <div>Distance</div>
                                <div>{strategy?.distance ?? '-'}</div>
                            </div>
                            <div>
                                <div>Distance Type</div>
                                <div>{strategy?.distanceType ?? '-'}</div>
                            </div>
                            <div>
                                <div>Side</div>
                                <div>{strategy?.side ?? '-'}</div>
                            </div>
                            <div>
                                <div>Total Size</div>
                                <div>{strategy?.totalSize ?? '-'}</div>
                            </div>
                            <div>
                                <div>Order Size</div>
                                <div>{strategy?.orderSize ?? '-'}</div>
                            </div>
                        </section>
                    </div>
                    <div className={styles.strategy_details_table}>
                        <header>
                            <span>Performance</span>
                        </header>
                        <section>
                            <div>
                                <div>Collateral</div>
                                <div>{strategy?.pnl ?? '-'}</div>
                            </div>
                            <div>
                                <div>PNL</div>
                                <div>{strategy?.pnl ?? '-'}</div>
                            </div>
                            <div>
                                <div>Volume</div>
                                <div>{strategy?.volume ?? '-'}</div>
                            </div>
                            <div>
                                <div>Max Drawdown</div>
                                <div>{strategy?.maxDrawdown ?? '-'}</div>
                            </div>
                            <div>
                                <div>Orders Placed</div>
                                <div>{strategy?.ordersPlaced ?? '-'}</div>
                            </div>
                            <div>
                                <div>Runtime</div>
                                <div>{strategy?.runtime ?? '-'}</div>
                            </div>
                            <div>
                                <div>Status</div>
                                <div
                                    style={{
                                        color: `var(${strategy?.isPaused ? '--red' : '--green'})`,
                                    }}
                                >
                                    {strategy?.isPaused ? 'Paused' : 'Running'}
                                </div>
                            </div>
                        </section>
                    </div>
                    <div className={styles.strategy_details_graph}>
                        <LineChart
                            lineData={lineData}
                            curve={'step'}
                            chartName={'strategy'}
                            width={350}
                            height={230}
                        />
                    </div>
                </div>
                <OrderHistory pageMode={false} />
                {removeStratModalCtrl.isOpen && (
                    <Modal
                        title='Remove Strategy'
                        close={removeStratModalCtrl.close}
                    >
                        <section className={styles.remove_strategy_modal}>
                            <p className={styles.remove_strat_modal_message}>
                                Are you sure you want to delete this strategy?
                            </p>
                            <div className={styles.remove_strat_modal_buttons}>
                                <SimpleButton
                                    onClick={removeStratModalCtrl.close}
                                    bg='dark4'
                                    hoverBg='dark2'
                                >
                                    Cancel
                                </SimpleButton>
                                <SimpleButton
                                    onClick={() => {
                                        if (strategy?.address) {
                                            strategies.remove(strategy.address);
                                            removeStratModalCtrl.close();
                                            navigate('/strategies');
                                        }
                                    }}
                                    bg='accent1'
                                >
                                    Delete
                                </SimpleButton>
                            </div>
                        </section>
                    </Modal>
                )}
            </div>
        </div>
    );
}
