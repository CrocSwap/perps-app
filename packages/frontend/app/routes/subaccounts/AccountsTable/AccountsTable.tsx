import { useMemo, useState } from 'react';
import styles from './AccountsTable.module.css';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import Tabs from '~/components/Tabs/Tabs';
import SortIcon from '~/components/Vault/SortIcon';
import type { accountIF } from '~/stores/AccountsStore';

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
    {
        name: 'Address',
        key: 'address',
        sortable: false,
    },
    {
        name: 'Account Equity',
        key: 'accountEquity',
        sortable: true,
    },
    {
        name: '',
        key: 'tradeLink',
        sortable: false,
    },
];

// interface for functional component props
interface propsIF {
    title: string;
    accounts: accountIF[];
    tabId: string;
    noSort?: boolean;
}

// main react functional component
export default function AccountsTable(props: propsIF) {
    const { title, accounts, tabId, noSort } = props;

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
                a.name.toLowerCase().localeCompare(b.name.toLocaleLowerCase()),
            );
        } else if (sortBy.cell === 'accountEquity') {
            output = [...accounts].sort((a: accountIF, b: accountIF) =>
                a.equity
                    .toLowerCase()
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
                                cursor: (noSort || !header.sortable) ? 'default' : 'pointer',
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
                            {header.sortable && !noSort && (
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
                                onClick={() => navigate('/trade')}
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
