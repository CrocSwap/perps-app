import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import Tabs from '~/components/Tabs/Tabs';
import SortIcon from '~/components/Vault/SortIcon';
import type { accountIF } from '~/stores/AccountsStore';
import styles from './AgentTable.module.css';
import { t } from 'i18next';

// interface for table column header metadata
export interface headerItemIF {
    name: string;
    key: string;
    sortable: boolean;
}

// data to label column headers
const tableHeaders: headerItemIF[] = [
    {
        name: t('tradeTable.time'),
        key: t('tradeTable.time'),
        sortable: true,
    },
    {
        name: t('tradeTable.type'),
        key: t('tradeTable.type'),
        sortable: true,
    },
    {
        name: t('tradeTable.coin'),
        key: t('tradeTable.coin'),
        sortable: true,
    },
    {
        name: t('tradeTable.direction'),
        key: t('tradeTable.direction'),
        sortable: true,
    },
    {
        name: t('tradeTable.size'),
        key: t('tradeTable.size'),
        sortable: true,
    },
    {
        name: t('tradeTable.filledSize'),
        key: t('tradeTable.filledSize'),
        sortable: true,
    },
    {
        name: t('tradeTable.orderValue'),
        key: t('tradeTable.orderValue'),
        sortable: true,
    },
    {
        name: t('tradeTable.price'),
        key: t('tradeTable.price'),
        sortable: true,
    },
    {
        name: t('tradeTable.reduceOnly'),
        key: t('tradeTable.reduceOnly'),
        sortable: true,
    },
    {
        name: t('tradeTable.triggerConditions'),
        key: t('tradeTable.triggerConditions'),
        sortable: true,
    },
    {
        name: 'TP/SL',
        key: 'tpsl',
        sortable: true,
    },
    {
        name: t('tradeTable.status'),
        key: t('tradeTable.status'),
        sortable: true,
    },
    {
        name: t('tradeTable.order'),
        key: t('tradeTable.order'),
        sortable: true,
    },
];

interface StrategyIF {
    time: string;
    type: string;
    coin: string;
    direction: 'Long' | 'Short';
    size: number;
    filledSize: number;
    orderValue: string;
    price: string;
    reduceOnly: string;
    triggerConditions: string[];
    tpsl: [string, string];
    status: 'Open' | 'Closed';
    orderId: number;
}

function mockData(count: number): StrategyIF[] {
    function getRandomDateString(): string {
        const startDate = new Date(2024, 0, 1);
        const endDate = new Date(2025, 4, 14);
        const randomDate = new Date(
            startDate.getTime() +
                Math.random() * (endDate.getTime() - startDate.getTime()),
        );
        return `${randomDate.getFullYear()}/\
            ${String(randomDate.getMonth() + 1).padStart(2, '0')}/\
            ${String(randomDate.getDate()).padStart(2, '0')} - \
            ${String(randomDate.getHours()).padStart(2, '0')}:\
            ${String(randomDate.getMinutes()).padStart(2, '0')}:\
            ${String(randomDate.getSeconds()).padStart(2, '0')}`;
    }
    function getRandomNumberPair(): [number, number] {
        const first = Math.max(0.0001, Math.random());
        const second = Math.max(first, Math.max(0.0001, Math.random()));
        return [first, second];
    }
    const [size, filledSize] = getRandomNumberPair();

    return Array(count)
        .fill(0)
        .map(() => ({
            time: getRandomDateString(),
            type: 'Limit',
            coin: 'ETH',
            direction: Math.random() < 0.5 ? 'Long' : 'Short',
            size,
            filledSize,
            orderValue:
                '$' + (Math.random() * 999.99 + 0.01).toFixed(2).toString(),
            price: (Math.random() * 999.99 + 0.01).toFixed(2).toString(),
            reduceOnly: Math.random() < 0.5 ? 'Yes' : 'No',
            triggerConditions: [],
            tpsl: ['--', '--'],
            status: Math.random() < 0.5 ? 'Open' : 'Closed',
            orderId: Math.floor(Math.random() * 9000000000) + 1000000000,
        }));
}

// interface for functional component props
interface propsIF {
    title: string;
    accounts: accountIF[];
    tabId: string;
}

// main react functional component
export default function StrategyTable(props: propsIF) {
    const { title, accounts, tabId } = props;

    // this is needed for the Trade link on each line item
    // should refactor it later as a `<Link />` elem
    const navigate = useNavigate();

    // data structure for the active sort methodology, putting both values
    // ... in a unified structure allows them to update concurrently
    interface sortByIF {
        cell: (typeof tableHeaders)[number]['key'];
        reverse: boolean;
    }
    const [sortBy, setSortBy] = useState<null | sortByIF>(null);

    // memoized record of sorted data, updates when the user changes the
    // ... active sort method or direction
    const sorted = useMemo<accountIF[]>(() => {
        // only return native unsorted sequence if `noSort` prop is passed
        if (!sortBy) return accounts;
        // declare an output variable
        let output: accountIF[];
        // assignment tree for output variable
        if (sortBy.cell === 'name') {
            output = [...accounts].sort((a: accountIF, b: accountIF) =>
                a.name?.toLowerCase().localeCompare(b.name.toLocaleLowerCase()),
            );
        } else if (sortBy.cell === 'accountEquity') {
            output = [...accounts].sort((a: accountIF, b: accountIF) =>
                a.equity
                    ?.toLowerCase()
                    .localeCompare(b.equity.toLocaleLowerCase()),
            );
        } else {
            output = accounts;
        }
        // return sorted data, reverse the sequence if relevant
        return sortBy.reverse ? output.reverse() : output;
    }, [accounts, sortBy]);

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

    // JSX return statement
    return (
        <div className={styles.table_wrapper}>
            <Tabs
                tabs={[title]}
                defaultTab={title}
                onTabChange={() => null}
                rightContent={<></>}
                wrapperId={tabId}
            />
            <motion.div
                className={styles.table_content}
                key={title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                <div className={styles.col_headers_row}>
                    {tableHeaders.map((header: headerItemIF) => (
                        <div
                            key={header.key}
                            style={{
                                cursor: !header.sortable
                                    ? 'default'
                                    : 'pointer',
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
                            {header.name}
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
                    {sorted.map((acct: accountIF) => (
                        <li key={JSON.stringify(acct)}>
                            <div>{acct.name}</div>
                            <div>{acct.address}</div>
                            <div>{acct.equity}</div>
                            <div
                                style={{
                                    justifyContent: 'flex-end',
                                    color: 'var(--accent1)',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate('/v2/trade')}
                            >
                                Trade
                            </div>
                        </li>
                    ))}
                    {sorted.length === 0 && (
                        <div
                            className={styles.container}
                            style={{
                                justifyContent: 'center',
                                padding: '2rem 0',
                            }}
                        >
                            No data to display
                        </div>
                    )}
                </ol>
            </motion.div>
        </div>
    );
}
