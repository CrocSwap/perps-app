import Button from '~/components/Button/Button';
import styles from './StrategyDetail.module.css';
import OrderHistory from '../orderHistory/orderHistory';
import { useNavigate, useParams } from 'react-router';
import { useStrategiesStore, type strategyDecoratedIF, type useStrategiesStoreIF } from '~/stores/StrategiesStore';
import { type useModalIF, useModal } from '~/hooks/useModal';
import Modal from '~/components/Modal/Modal';

export default function Strategies() {
    const navigate = useNavigate();
    const { address } = useParams();
    const strategies: useStrategiesStoreIF = useStrategiesStore();

    const strategy: strategyDecoratedIF|undefined = strategies.data.find(
        (s: strategyDecoratedIF) => s.address === address
    );

    const removeStratModalCtrl: useModalIF = useModal();

    if (!strategy) return;

    return (
        <div className={styles.strategies_page}>
            <h2>{strategy.name}</h2>
            <p className={styles.strategies_blurb}>
                Run an automated market making strategy
            </p>
            <div className={styles.strategies_learn_more}>Learn more</div>
            <div className={styles.strategy_select}>
                <div className={styles.strategy_select_left}>
                    <Button
                        onClick={() => console.log('Strategy Paused!')}
                        size='medium'
                        selected
                    >
                        Pause
                    </Button>
                    <Button
                        onClick={() => removeStratModalCtrl.open()}
                        size='medium'
                        selected
                    >
                        Remove
                    </Button>
                    <Button
                        onClick={() => navigate(
                            `/strategies/${address}/edit`,
                            { state: { strategy, address } },
                        )}
                        size='medium'
                        selected
                    >
                        Edit
                    </Button>
                </div>
                <div className={styles.strategy_select_right}>
                    <Button
                        onClick={() => navigate('/strategies/new')}
                        size='medium'
                        selected
                    >
                        New Strategy
                    </Button>
                </div>
            </div>
            <div className={styles.strategy_details}>
                <div className={styles.strategy_details_table}>
                    <header>
                        <span>Parameters</span>
                    </header>
                    <section>
                        <div>
                            <div>Market</div>
                            <div>{strategy.market}</div>
                        </div>
                        <div>
                            <div>Distance</div>
                            <div>{strategy.distance}</div>
                        </div>
                        <div>
                            <div>Distance Type</div>
                            <div>{strategy.distanceType}</div>
                        </div>
                        <div>
                            <div>Side</div>
                            <div>{strategy.side}</div>
                        </div>
                        <div>
                            <div>Total Size</div>
                            <div>{strategy.totalSize}</div>
                        </div>
                        <div>
                            <div>Order Size</div>
                            <div>{strategy.orderSize}</div>
                        </div>
                    </section>
                </div>
                <div className={styles.strategy_details_table}>
                    <header>
                        <span>Performance</span>
                    </header>
                    <section>
                        <div>
                            <div>PNL</div>
                            <div>{strategy.pnl}</div>
                        </div>
                        <div>
                            <div>Volume</div>
                            <div>{strategy.volume}</div>
                        </div>
                        <div>
                            <div>Max Drawdown</div>
                            <div>{strategy.maxDrawdown}</div>
                        </div>
                        <div>
                            <div>Orders Placed</div>
                            <div>{strategy.ordersPlaced}</div>
                        </div>
                        <div>
                            <div>Runtime</div>
                            <div>{strategy.runtime}</div>
                        </div>
                    </section>
                </div>
                <div className={styles.strategy_details_graph}></div>
            </div>
            <OrderHistory />
            { removeStratModalCtrl.isOpen && (
                <Modal
                    title='Remove Strategy'
                    close={removeStratModalCtrl.close}
                >
                    <section className={styles.remove_strategy_modal}>
                        <p className={styles.remove_strat_modal_message}>
                            Are you sure you want to delete this strategy?
                        </p>
                        <div className={styles.remove_strat_modal_buttons}>
                            <Button
                                onClick={removeStratModalCtrl.close}
                                size='large'
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    strategies.remove(strategy.address);
                                    removeStratModalCtrl.close();
                                    navigate('/strategies');
                                }}
                                size='large'
                                selected
                            >
                                Delete
                            </Button>
                        </div>
                    </section>
                </Modal>
            )}
        </div>
    );
}
