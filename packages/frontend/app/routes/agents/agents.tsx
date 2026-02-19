import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { LuX } from 'react-icons/lu';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import SortIcon from '~/components/Vault/SortIcon';
import { useTranslation } from 'react-i18next';
import {
    useStrategiesStore,
    type strategyDecoratedIF,
} from '~/stores/AgentsStore';
import { externalResources } from '~/utils/Constants';
import styles from './agents.module.css';

// interface for table column header metadata
export interface headerItemIF {
    name: string;
    key: string;
    sortable: boolean;
}

// data to label column headers
const tableHeaders: headerItemIF[] = [
    {
        name: 'Name',
        key: 'name',
        sortable: true,
    },
    // would this be better as a filter than a sort?
    {
        name: 'Status',
        key: 'status',
        sortable: true,
    },
    {
        name: 'Collateral',
        key: 'collateral',
        sortable: true,
    },
    {
        name: 'Volume',
        key: 'volume',
        sortable: true,
    },
    {
        name: 'PnL',
        key: 'pnl',
        sortable: true,
    },
    {
        name: '',
        key: 'actions',
        sortable: false,
    },
];

function parseAmount(value: string): number {
    const numeric = Number(value.replace(/[^0-9.-]+/g, ''));
    return Number.isNaN(numeric) ? 0 : numeric;
}

const AGENTS_BASE_PATH = '/v2/agents';

export default function Agents() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data, togglePause, remove } = useStrategiesStore();

    // data structure for the active sort methodology, putting both values
    // ... in a unified structure allows them to update concurrently
    interface sortByIF {
        cell: (typeof tableHeaders)[number]['key'];
        reverse: boolean;
    }
    const [sortBy, setSortBy] = useState<null | sortByIF>(null);

    // memoized record of sorted data, updates when the user changes the
    // ... active sort method or direction
    const sorted = useMemo<strategyDecoratedIF[]>(() => {
        // only return native unsorted sequence if `noSort` prop is passed
        if (!sortBy) return data;
        // declare an output variable
        let output: strategyDecoratedIF[];
        // assignment tree for output variable
        if (sortBy.cell === 'name') {
            output = [...data].sort(
                (a: strategyDecoratedIF, b: strategyDecoratedIF) =>
                    a.name
                        ?.toLowerCase()
                        .localeCompare(b.name.toLocaleLowerCase()),
            );
        } else if (sortBy.cell === 'status') {
            output = [...data].sort(
                (a: strategyDecoratedIF, b: strategyDecoratedIF) => {
                    if (a.isPaused && b.isPaused) {
                        return 0;
                    } else if (a.isPaused) {
                        return 1;
                    } else if (b.isPaused) {
                        return -1;
                    } else {
                        return 0;
                    }
                },
            );
        } else if (sortBy.cell === 'collateral') {
            output = [...data].sort(
                (a: strategyDecoratedIF, b: strategyDecoratedIF) => {
                    return (
                        parseAmount(a.collateral) - parseAmount(b.collateral)
                    );
                },
            );
        } else if (sortBy.cell === 'volume') {
            output = [...data].sort(
                (a: strategyDecoratedIF, b: strategyDecoratedIF) => {
                    return parseAmount(a.volume) - parseAmount(b.volume);
                },
            );
        } else if (sortBy.cell === 'pnl') {
            output = [...data].sort(
                (a: strategyDecoratedIF, b: strategyDecoratedIF) => {
                    return parseAmount(a.pnl) - parseAmount(b.pnl);
                },
            );
        } else {
            output = data;
        }
        // return sorted data, reverse the sequence if relevant
        return sortBy.reverse ? output.reverse() : output;
    }, [data, sortBy]);

    // fn to determine whether the sort direction is inverted
    function checkSortDirection(
        col: (typeof tableHeaders)[number]['key'],
    ): 'asc' | 'desc' | '' {
        // functionality is irrelevant if no sort is active
        if (!sortBy) return '';
        // declare an output variable, fallback val will highlight neither arrow
        let output: 'asc' | 'desc' | '' = '';
        // return `asc` or `desc` to mark arrow indicating direction
        if (col === sortBy.cell) {
            output = sortBy.reverse ? 'asc' : 'desc';
        }
        // return output
        return output;
    }

    const [agentToRemove, setAgentToRemove] =
        useState<strategyDecoratedIF | null>(null);

    return (
        <div className={styles.strategies_page}>
            <header>
                <div className={styles.title_row}>
                    <h2>{t('pageTitles.agents')}</h2>
                    <SimpleButton
                        onClick={() => navigate(`${AGENTS_BASE_PATH}/new`)}
                        hoverBg='accent1'
                        className={styles.create_button}
                    >
                        {t('agents.overview.create')}
                    </SimpleButton>
                </div>
                <p className={styles.blurb}>{t('agents.overview.blurb')}</p>
                <a
                    href={externalResources.perpsDocs}
                    target='_blank'
                    rel='noopener noreferrer me'
                    className={styles.learn_more}
                >
                    {t('common.learnMore')}
                </a>
            </header>
            <div className={styles.table_wrapper}>
                <div className={styles.table_tab}>{t('pageTitles.agents')}</div>
                <div className={styles.table_content}>
                    <div className={styles.col_headers_row}>
                        {tableHeaders.map((header: headerItemIF) => (
                            <div
                                key={header.key}
                                style={{
                                    cursor: header.sortable
                                        ? 'pointer'
                                        : 'default',
                                }}
                                onClick={() => {
                                    if (!header.sortable) return;
                                    let output: null | sortByIF = null;
                                    if (sortBy) {
                                        output = {
                                            cell: header.key,
                                            reverse: !sortBy.reverse,
                                        };
                                    } else {
                                        output = {
                                            cell: header.key,
                                            reverse: false,
                                        };
                                    }
                                    setSortBy(output);
                                }}
                            >
                                {header.key === 'name' && t('forms.name')}
                                {header.key === 'status' &&
                                    t('tradeTable.status')}
                                {header.key === 'collateral' &&
                                    t('portfolio.collateral')}
                                {header.key === 'volume' &&
                                    t('portfolio.volume')}
                                {header.key === 'pnl' && t('portfolio.pnl')}
                                {header.sortable && (
                                    <SortIcon
                                        sortDirection={checkSortDirection(
                                            header.key,
                                        )}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    <ol className={styles.table_body}>
                        {sorted.map((strat: strategyDecoratedIF) => (
                            <li
                                key={strat.address}
                                onClick={() =>
                                    navigate(
                                        `${AGENTS_BASE_PATH}/${strat.address}`,
                                    )
                                }
                            >
                                <div>{strat.name}</div>
                                <div>
                                    {strat.isPaused
                                        ? t('agents.overview.paused')
                                        : t('agents.overview.running')}
                                </div>
                                <div>{strat.collateral}</div>
                                <div>{strat.volume}</div>
                                <div className={styles.pnl_cell}>
                                    {strat.pnl} <span>(+12.0%)</span>
                                </div>
                                <div className={styles.actions_cell}>
                                    <button
                                        type='button'
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            togglePause(strat.address);
                                        }}
                                    >
                                        {strat.isPaused
                                            ? t('agents.overview.unpause')
                                            : t('agents.overview.pause')}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            navigate(
                                                `${AGENTS_BASE_PATH}/${strat.address}/edit`,
                                                {
                                                    state: {
                                                        agent: strat,
                                                        address: strat.address,
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        {t('common.edit')}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                    >
                                        {t('common.transfer')}
                                    </button>
                                    <button
                                        type='button'
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setAgentToRemove(strat);
                                        }}
                                    >
                                        {t('agents.overview.remove')}
                                    </button>
                                </div>
                            </li>
                        ))}
                        {sorted.length === 0 && (
                            <div className={styles.empty_state}>
                                {t('agents.overview.emptyState')}
                            </div>
                        )}
                    </ol>
                </div>
            </div>
            {agentToRemove && (
                <Modal
                    title={t('agents.overview.removeTitle')}
                    close={() => setAgentToRemove(null)}
                    noHeader
                >
                    <section className={styles.remove_strategy_modal}>
                        <button
                            type='button'
                            className={styles.modal_close}
                            onClick={() => setAgentToRemove(null)}
                        >
                            <LuX size={18} />
                        </button>
                        <h3>{t('agents.overview.removeTitle')}</h3>
                        <p>{t('agents.overview.removeMessage')}</p>
                        <div className={styles.remove_actions}>
                            <SimpleButton
                                bg='dark4'
                                hoverBg='dark2'
                                onClick={() => setAgentToRemove(null)}
                            >
                                {t('common.cancel')}
                            </SimpleButton>
                            <SimpleButton
                                bg='accent1'
                                hoverBg='accent1'
                                onClick={() => {
                                    remove(agentToRemove.address);
                                    setAgentToRemove(null);
                                }}
                            >
                                {t('agents.overview.remove')}
                            </SimpleButton>
                        </div>
                    </section>
                </Modal>
            )}
        </div>
    );
}
