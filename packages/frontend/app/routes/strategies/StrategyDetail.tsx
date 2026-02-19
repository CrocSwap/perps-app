import { LuChevronLeft, LuCopy, LuFilter, LuX } from 'react-icons/lu';
import styles from './StrategyDetail.module.css';
import { useNavigate, useParams } from 'react-router';
import {
    useStrategiesStore,
    type strategyDecoratedIF,
    type useStrategiesStoreIF,
} from '~/stores/StrategiesStore';
import { useModal } from '~/hooks/useModal';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import TransferModal from '~/components/TransferModal/TransferModal';
import StrategyDetailChart from './StrategyDetailChart';

const STRATEGIES_BASE_PATH = '/v2/strategies';

const mockOrderRows = Array.from({ length: 4 }, () => ({
    time: '2025/02/24 - 16:51:12',
    type: 'Limit',
    coin: 'ETH',
    direction: 'Long',
    size: '0.0001',
    filledSize: '0.0001',
    orderValue: '$10.49',
    price: '2,460.90',
    reduceOnly: 'No',
    triggerConditions: 'N/A',
    tpSl: '-- / --',
    status: 'Open',
    orderId: '1234567890',
}));

export default function Strategies() {
    // hook to manage navigation actions from this page
    const navigate = useNavigate();

    // address of the strategy from URL params
    const { strategy_hash } = useParams();

    // strategy data to populate in this page
    const strategies: useStrategiesStoreIF = useStrategiesStore();
    const strategy: strategyDecoratedIF | undefined = strategies.data.find(
        (s: strategyDecoratedIF) => s.address === strategy_hash,
    );

    // logic to control the strategy removal modal
    const removeStratModalCtrl = useModal();

    // logic to control the transfer modal
    const transferModalCtrl = useModal();

    const statusLabel = strategy?.isPaused ? 'Paused' : 'Running';

    return (
        <div className={styles.strategy_detail_page}>
            <div className={styles.strategy_shell}>
                <header className={styles.page_header}>
                    <div className={styles.header_left}>
                        <div className={styles.back_and_title}>
                            <button
                                type='button'
                                className={styles.back_button}
                                onClick={() => navigate(STRATEGIES_BASE_PATH)}
                            >
                                <LuChevronLeft />
                            </button>
                            <h2>{strategy?.name ?? 'No Strategy Found'}</h2>
                        </div>
                        <div className={styles.address_row}>
                            <p>{strategy?.address}</p>
                            <button
                                type='button'
                                className={styles.copy_address}
                                onClick={() => {
                                    if (!strategy?.address) return;
                                    void navigator.clipboard.writeText(
                                        strategy.address,
                                    );
                                }}
                            >
                                <LuCopy size={12} />
                            </button>
                        </div>
                    </div>
                    <div className={styles.header_right}>
                        <div className={styles.status_label}>
                            Status: {statusLabel}
                        </div>
                        <SimpleButton
                            onClick={() =>
                                strategy &&
                                strategies.togglePause(strategy.address)
                            }
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.header_action}
                        >
                            {strategy?.isPaused ? 'Unpause' : 'Pause'}
                        </SimpleButton>
                        <SimpleButton
                            onClick={() =>
                                navigate(
                                    `${STRATEGIES_BASE_PATH}/${strategy_hash}/edit`,
                                    {
                                        state: {
                                            strategy,
                                            address: strategy_hash,
                                        },
                                    },
                                )
                            }
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.header_action}
                        >
                            Edit
                        </SimpleButton>
                        <SimpleButton
                            onClick={() => transferModalCtrl.open()}
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.header_action}
                        >
                            Transfer
                        </SimpleButton>
                        <SimpleButton
                            onClick={() => removeStratModalCtrl.open()}
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.header_action}
                        >
                            Remove
                        </SimpleButton>
                    </div>
                </header>
                <div className={styles.strategy_details}>
                    <div className={styles.detail_table}>
                        <header className={styles.detail_header}>
                            <span>Parameters</span>
                        </header>
                        <section className={styles.detail_rows}>
                            <div className={styles.detail_row}>
                                <div>Market</div>
                                <div>{strategy?.market ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>Distance</div>
                                <div>{strategy?.distance ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>Distance Type</div>
                                <div>{strategy?.distanceType ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>Side</div>
                                <div>{strategy?.side ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>Total Size</div>
                                <div>{strategy?.totalSize ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>Order Size</div>
                                <div>{strategy?.orderSize ?? '-'}</div>
                            </div>
                        </section>
                    </div>
                    <div className={styles.detail_table}>
                        <header className={styles.detail_header}>
                            <span>Performance</span>
                        </header>
                        <section className={styles.detail_rows}>
                            <div className={styles.detail_row}>
                                <div>Collateral</div>
                                <div>{strategy?.collateral ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>PnL</div>
                                <div>{strategy?.pnl ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>Volume</div>
                                <div>{strategy?.volume ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>Max Drawdown</div>
                                <div>{strategy?.maxDrawdown ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>Orders Placed</div>
                                <div>{strategy?.ordersPlaced ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>Runtime</div>
                                <div>{strategy?.runtime ?? '-'} Hours</div>
                            </div>
                        </section>
                    </div>
                    <div className={styles.strategy_details_graph}>
                        <StrategyDetailChart />
                    </div>
                </div>
                <div className={styles.order_history_card}>
                    <div className={styles.history_header}>
                        <span className={styles.history_tab}>
                            Order History
                        </span>
                        <button type='button' className={styles.filter_button}>
                            Filter <LuFilter size={14} />
                        </button>
                    </div>
                    <div className={styles.history_table}>
                        <div className={styles.history_row_header}>
                            <span>Time</span>
                            <span>Type</span>
                            <span>Coin</span>
                            <span>Direction</span>
                            <span>Size</span>
                            <span>Filled Size</span>
                            <span>Order Value</span>
                            <span>Price</span>
                            <span>Reduce Only</span>
                            <span>Trigger Conditions</span>
                            <span>TP/SL</span>
                            <span>Status</span>
                            <span>Order ID</span>
                        </div>
                        {mockOrderRows.map((row) => (
                            <div
                                key={`${row.time}-${row.orderId}`}
                                className={styles.history_row}
                            >
                                <span>{row.time}</span>
                                <span>{row.type}</span>
                                <span>{row.coin}</span>
                                <span className={styles.long_value}>
                                    {row.direction}
                                </span>
                                <span>{row.size}</span>
                                <span>{row.filledSize}</span>
                                <span>{row.orderValue}</span>
                                <span>{row.price}</span>
                                <span>{row.reduceOnly}</span>
                                <span>{row.triggerConditions}</span>
                                <span>{row.tpSl}</span>
                                <span>{row.status}</span>
                                <span>{row.orderId}</span>
                            </div>
                        ))}
                    </div>
                    <button type='button' className={styles.view_all}>
                        View All
                    </button>
                </div>
                {removeStratModalCtrl.isOpen && (
                    <Modal
                        title='Remove Strategy'
                        close={removeStratModalCtrl.close}
                        noHeader
                    >
                        <section className={styles.remove_strategy_modal}>
                            <button
                                type='button'
                                className={styles.modal_close}
                                onClick={removeStratModalCtrl.close}
                            >
                                <LuX size={18} />
                            </button>
                            <h3>Remove Strategy</h3>
                            <p>
                                Are you sure you want to remove this strategy?
                            </p>
                            <div className={styles.remove_actions}>
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
                                            navigate(STRATEGIES_BASE_PATH);
                                        }
                                    }}
                                    bg='accent1'
                                >
                                    Remove
                                </SimpleButton>
                            </div>
                        </section>
                    </Modal>
                )}
                {transferModalCtrl.isOpen && (
                    <TransferModal closeModal={transferModalCtrl.close} />
                )}
            </div>
        </div>
    );
}
