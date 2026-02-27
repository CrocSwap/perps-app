import { LuChevronLeft, LuCopy, LuFilter, LuCheck } from 'react-icons/lu';
import styles from './AgentDetail.module.css';
import { useNavigate, useParams } from 'react-router';
import {
    useStrategiesStore,
    type strategyDecoratedIF,
    type useStrategiesStoreIF,
} from '~/stores/AgentsStore';
import { useModal } from '~/hooks/useModal';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import TransferModal from '~/components/TransferModal/TransferModal';
import AgentDetailChart from './AgentDetailChart';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';

const AGENTS_BASE_PATH = '/v2/agents';

const mockOrderRows = Array.from({ length: 20 }, (_, i) => ({
    time: '2025/02/24 - 16:51:12',
    type: i % 3 === 0 ? 'Market' : 'Limit',
    coin: ['ETH', 'BTC', 'SOL'][i % 3],
    direction: i % 2 === 0 ? 'Long' : 'Short',
    size: '0.0001',
    filledSize: '0.0001',
    orderValue: '$10.49',
    price: '2,460.90',
    reduceOnly: 'No',
    triggerConditions: 'N/A',
    tpSl: '-- / --',
    status: i % 4 === 0 ? 'Filled' : 'Open',
    orderId: `123456789${i}`,
}));

export default function AgentDetail() {
    // hook to manage navigation actions from this page
    const navigate = useNavigate();
    const { t } = useTranslation();

    // address of the agent from URL params
    const { agent_hash } = useParams();

    // agent data to populate in this page
    const strategies: useStrategiesStoreIF = useStrategiesStore();
    const strategy: strategyDecoratedIF | undefined = strategies.data.find(
        (s: strategyDecoratedIF) => s.address === agent_hash,
    );

    // logic to control the agent removal modal
    const removeStratModalCtrl = useModal();

    // logic to control the transfer modal
    const transferModalCtrl = useModal();

    // state for copy feedback
    const [copied, setCopied] = useState(false);

    // mobile tab state for the detail panels
    const [detailTab, setDetailTab] = useState<
        'parameters' | 'performance' | 'chart'
    >('parameters');

    // infinite scroll for order history
    const ROWS_PER_PAGE = 8;
    const [visibleCount, setVisibleCount] = useState(ROWS_PER_PAGE);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) =>
                        Math.min(prev + ROWS_PER_PAGE, mockOrderRows.length),
                    );
                }
            },
            { root: tableRef.current, threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    // re-check scroll position whenever rows are added
    useEffect(() => {
        const el = tableRef.current;
        if (el) {
            setIsAtBottom(
                el.scrollHeight - el.scrollTop - el.clientHeight < 20,
            );
        }
    }, [visibleCount]);

    const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 20);
    };

    const statusLabel = strategy?.isPaused
        ? t('agents.overview.paused')
        : t('agents.overview.running');

    // copy address to clipboard with feedback
    const handleCopyAddress = async () => {
        if (!strategy?.address) return;

        try {
            await navigator.clipboard.writeText(strategy.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy address:', err);
        }
    };

    return (
        <div className={styles.strategy_detail_page}>
            <div className={styles.strategy_shell}>
                <header className={styles.page_header}>
                    <div className={styles.header_left}>
                        <div className={styles.back_and_title}>
                            <button
                                type='button'
                                className={styles.back_button}
                                onClick={() => navigate(AGENTS_BASE_PATH)}
                            >
                                <LuChevronLeft />
                            </button>
                            <h2>
                                {strategy?.name ??
                                    t('agents.details.noAgentFound')}
                            </h2>
                            <div
                                className={styles.status_badge}
                                data-paused={String(
                                    strategy?.isPaused ?? false,
                                )}
                            >
                                {statusLabel}
                            </div>
                        </div>
                        <div className={styles.address_row}>
                            <button
                                type='button'
                                className={styles.address_button}
                                onClick={handleCopyAddress}
                                disabled={!strategy?.address}
                            >
                                <span>{strategy?.address}</span>
                                {copied ? (
                                    <LuCheck
                                        size={12}
                                        className={styles.check_icon}
                                    />
                                ) : (
                                    <LuCopy size={12} />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className={styles.header_right}>
                        <div className={styles.status_label}>
                            {t('agents.details.status')}: {statusLabel}
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
                            {strategy?.isPaused
                                ? t('agents.overview.unpause')
                                : t('agents.overview.pause')}
                        </SimpleButton>
                        <SimpleButton
                            onClick={() =>
                                navigate(
                                    `${AGENTS_BASE_PATH}/${agent_hash}/edit`,
                                    {
                                        state: {
                                            agent: strategy,
                                            address: agent_hash,
                                        },
                                    },
                                )
                            }
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.header_action}
                        >
                            {t('common.edit')}
                        </SimpleButton>
                        <SimpleButton
                            onClick={() => transferModalCtrl.open()}
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.header_action}
                        >
                            {t('common.transfer')}
                        </SimpleButton>
                        <SimpleButton
                            onClick={() => removeStratModalCtrl.open()}
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.header_action}
                        >
                            {t('agents.overview.remove')}
                        </SimpleButton>
                    </div>
                    {/* Mobile-only horizontal action strip */}
                    <div className={styles.mobile_actions}>
                        <SimpleButton
                            onClick={() =>
                                strategy &&
                                strategies.togglePause(strategy.address)
                            }
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.mobile_action_btn}
                        >
                            {strategy?.isPaused
                                ? t('agents.overview.unpause')
                                : t('agents.overview.pause')}
                        </SimpleButton>
                        <SimpleButton
                            onClick={() =>
                                navigate(
                                    `${AGENTS_BASE_PATH}/${agent_hash}/edit`,
                                    {
                                        state: {
                                            agent: strategy,
                                            address: agent_hash,
                                        },
                                    },
                                )
                            }
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.mobile_action_btn}
                        >
                            {t('common.edit')}
                        </SimpleButton>
                        <SimpleButton
                            onClick={() => transferModalCtrl.open()}
                            bg='dark3'
                            hoverBg='dark4'
                            className={styles.mobile_action_btn}
                        >
                            {t('common.transfer')}
                        </SimpleButton>
                        <SimpleButton
                            onClick={() => removeStratModalCtrl.open()}
                            bg='dark3'
                            hoverBg='dark4'
                            className={`${styles.mobile_action_btn} ${styles.mobile_action_danger}`}
                        >
                            {t('agents.overview.remove')}
                        </SimpleButton>
                    </div>
                </header>
                {/* Mobile-only tab bar */}
                <div className={styles.detail_tabs}>
                    <button
                        type='button'
                        className={`${styles.detail_tab_btn} ${detailTab === 'parameters' ? styles.detail_tab_active : ''}`}
                        onClick={() => setDetailTab('parameters')}
                    >
                        {t('agents.details.parameters')}
                    </button>
                    <button
                        type='button'
                        className={`${styles.detail_tab_btn} ${detailTab === 'performance' ? styles.detail_tab_active : ''}`}
                        onClick={() => setDetailTab('performance')}
                    >
                        {t('agents.details.performance')}
                    </button>
                    <button
                        type='button'
                        className={`${styles.detail_tab_btn} ${detailTab === 'chart' ? styles.detail_tab_active : ''}`}
                        onClick={() => setDetailTab('chart')}
                    >
                        {t('agents.details.chart')}
                    </button>
                </div>
                <div className={styles.strategy_details}>
                    <div
                        className={`${styles.detail_table} ${detailTab !== 'parameters' ? styles.detail_panel_hidden : ''}`}
                    >
                        <header className={styles.detail_header}>
                            <span>{t('agents.details.parameters')}</span>
                        </header>
                        <section className={styles.detail_rows}>
                            <div className={styles.detail_row}>
                                <div>{t('agents.form.labels.market')}</div>
                                <div>{strategy?.market ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>{t('agents.form.labels.distance')}</div>
                                <div>{strategy?.distance ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>
                                    {t('agents.form.labels.distanceType')}
                                </div>
                                <div>{strategy?.distanceType ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>{t('agents.form.labels.side')}</div>
                                <div>{strategy?.side ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>{t('agents.form.labels.totalSize')}</div>
                                <div>{strategy?.totalSize ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>{t('agents.form.labels.orderSize')}</div>
                                <div>{strategy?.orderSize ?? '-'}</div>
                            </div>
                        </section>
                    </div>
                    <div
                        className={`${styles.detail_table} ${detailTab !== 'performance' ? styles.detail_panel_hidden : ''}`}
                    >
                        <header className={styles.detail_header}>
                            <span>{t('agents.details.performance')}</span>
                        </header>
                        <section className={styles.detail_rows}>
                            <div className={styles.detail_row}>
                                <div>{t('portfolio.collateral')}</div>
                                <div>{strategy?.collateral ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>PnL</div>
                                <div>{strategy?.pnl ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>{t('portfolio.volume')}</div>
                                <div>{strategy?.volume ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>{t('portfolio.maxDrawdown')}</div>
                                <div>{strategy?.maxDrawdown ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>{t('agents.details.ordersPlaced')}</div>
                                <div>{strategy?.ordersPlaced ?? '-'}</div>
                            </div>
                            <div className={styles.detail_row}>
                                <div>{t('agents.details.runtime')}</div>
                                <div>
                                    {strategy?.runtime ?? '-'}{' '}
                                    {t('agents.details.hours')}
                                </div>
                            </div>
                        </section>
                    </div>
                    <div
                        className={`${styles.strategy_details_graph} ${detailTab !== 'chart' ? styles.detail_panel_hidden : ''}`}
                    >
                        <AgentDetailChart />
                    </div>
                </div>
                <div className={styles.order_history_card}>
                    <div className={styles.history_header}>
                        <span className={styles.history_tab}>
                            {t('agents.details.orderHistory')}
                        </span>
                        <button type='button' className={styles.filter_button}>
                            {t('agents.details.filter')} <LuFilter size={14} />
                        </button>
                    </div>
                    <div className={styles.history_table_wrap}>
                        <div
                            className={styles.history_table}
                            ref={tableRef}
                            onScroll={handleTableScroll}
                        >
                            <div className={styles.history_row_header}>
                                <span>{t('tradeTable.time')}</span>
                                <span>{t('tradeTable.type')}</span>
                                <span>{t('tradeTable.coin')}</span>
                                <span>{t('tradeTable.direction')}</span>
                                <span>{t('tradeTable.size')}</span>
                                <span>{t('tradeTable.filledSize')}</span>
                                <span>{t('tradeTable.orderValue')}</span>
                                <span>{t('tradeTable.price')}</span>
                                <span>{t('tradeTable.reduceOnly')}</span>
                                <span>{t('tradeTable.triggerConditions')}</span>
                                <span>{t('tradeTable.tpsl')}</span>
                                <span>{t('tradeTable.status')}</span>
                                <span>{t('tradeTable.orderId')}</span>
                            </div>
                            {mockOrderRows.slice(0, visibleCount).map((row) => (
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
                            {visibleCount < mockOrderRows.length && (
                                <div
                                    ref={sentinelRef}
                                    className={styles.scroll_sentinel}
                                />
                            )}
                        </div>
                        {!isAtBottom && <div className={styles.history_fade} />}
                    </div>
                </div>
                {removeStratModalCtrl.isOpen && (
                    <Modal
                        title={t('agents.overview.removeTitle')}
                        close={removeStratModalCtrl.close}
                    >
                        <section className={styles.remove_strategy_modal}>
                            <div className={styles.remove_agent_info}>
                                <div className={styles.remove_agent_row}>
                                    <span className={styles.remove_agent_label}>
                                        {t('forms.name')}
                                    </span>
                                    <span className={styles.remove_agent_value}>
                                        {strategy?.name}
                                    </span>
                                </div>
                                <div className={styles.remove_agent_row}>
                                    <span className={styles.remove_agent_label}>
                                        {t('forms.address')}
                                    </span>
                                    <span className={styles.remove_agent_value}>
                                        {strategy?.address}
                                    </span>
                                </div>
                            </div>
                            <p>{t('agents.overview.removeMessage')}</p>
                            <div className={styles.remove_actions}>
                                <SimpleButton
                                    onClick={removeStratModalCtrl.close}
                                    bg='dark4'
                                    hoverBg='dark2'
                                >
                                    {t('common.cancel')}
                                </SimpleButton>
                                <SimpleButton
                                    onClick={() => {
                                        if (strategy?.address) {
                                            strategies.remove(strategy.address);
                                            removeStratModalCtrl.close();
                                            navigate(AGENTS_BASE_PATH);
                                        }
                                    }}
                                    bg='accent1'
                                >
                                    {t('agents.overview.remove')}
                                </SimpleButton>
                            </div>
                        </section>
                    </Modal>
                )}
                {transferModalCtrl.isOpen && (
                    <TransferModal
                        agent={strategy}
                        closeModal={transferModalCtrl.close}
                    />
                )}
            </div>
        </div>
    );
}
