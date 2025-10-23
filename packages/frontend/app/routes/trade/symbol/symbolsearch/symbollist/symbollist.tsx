import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { BsStars } from 'react-icons/bs';
import { FiSearch } from 'react-icons/fi';
import { IoCloseOutline } from 'react-icons/io5';
import { MdSearchOff } from 'react-icons/md';
import { useNavigate } from 'react-router';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import styles from './symbollist.module.css';
import SymbolListTableHeader from './SymbolListTableHeader';
import SymbolListTableRow from './SymbolListTableRow';

interface SymbolListProps {
    setIsOpen: (isOpen: boolean) => void;
    variant?: 'dropdown' | 'sheet';
}

const SymbolList: React.FC<SymbolListProps> = ({
    setIsOpen,
    variant = 'dropdown',
}) => {
    const navigate = useNavigate();

    const { coins, setSymbol, favKeys } = useTradeDataStore();

    const [searchQuery, setSearchQuery] = useState('');

    const [sortBy, setSortBy] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<string>('');

    const symbolSelectListener = (coin: string) => {
        setSymbol(coin);
        navigate(`/v2/trade/${coin}`, { viewTransition: true });
        setIsOpen(false);
    };

    const sortClickHandler = (key: string) => {
        if (key === sortBy) {
            if (sortDirection === 'desc') {
                setSortDirection('asc');
            } else if (sortDirection === 'asc') {
                setSortDirection('');
                setSortBy('');
            } else {
                setSortDirection('desc');
            }
        } else {
            setSortBy(key);
            setSortDirection('desc');
        }
    };

    const inputKeyHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            if (searchQuery.length > 0) {
                setSearchQuery('');
            } else {
                setIsOpen(false);
            }
        }
    };

    const sortSymbols = (
        symbols: SymbolInfoIF[],
        sortBy: string,
        sortDirection: string,
    ) => {
        switch (sortBy) {
            case 'symbol':
                return [...symbols].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.coin.localeCompare(b.coin)
                        : b.coin.localeCompare(a.coin),
                );
            case 'lastPrice':
                return [...symbols].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.markPx - b.markPx
                        : b.markPx - a.markPx,
                );
            case 'change':
                return [...symbols].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.last24hPriceChangePercent -
                          b.last24hPriceChangePercent
                        : b.last24hPriceChangePercent -
                          a.last24hPriceChangePercent,
                );
            case 'funding':
                return [...symbols].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.funding - b.funding
                        : b.funding - a.funding,
                );
            case 'volume':
                return [...symbols].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.dayNtlVlm - b.dayNtlVlm
                        : b.dayNtlVlm - a.dayNtlVlm,
                );
            case 'openInterest':
                return [...symbols].sort((a, b) =>
                    sortDirection === 'asc'
                        ? a.openInterestDollarized - b.openInterestDollarized
                        : b.openInterestDollarized - a.openInterestDollarized,
                );
            default: {
                return [...symbols];
            }
        }
    };

    const sortedSymbols = useMemo(() => {
        const favCoins = coins.filter((c) => favKeys.includes(c.coin));
        const otherCoins = coins.filter(
            (c) => !favKeys.includes(c.coin) && c.openInterest > 0,
        );
        return [
            ...sortSymbols(favCoins, sortBy, sortDirection),
            ...sortSymbols(otherCoins, sortBy, sortDirection),
        ];
    }, [coins, sortBy, sortDirection, favKeys]);

    const coinsToShow = useMemo(() => {
        if (searchQuery.length === 0) {
            return sortedSymbols.slice(0, 50);
        }
        return sortedSymbols.filter((c) =>
            c.coin?.toLowerCase().includes(searchQuery?.toLowerCase()),
        );
    }, [searchQuery, sortedSymbols]);

    const filterTabs = (
        <section className={styles.filterTabsContainer}>
            {/* color to simulate active tab */}
            <button style={{ color: 'var(--text1)' }}>All Coins</button>
            <button className={styles.filterNewButton}>
                New <BsStars color='var(--accent1)' size={14} />
            </button>
            <button>Trending</button>
        </section>
    );

    return (
        <>
            <motion.div
                className={`${styles.symbolListWrapper} ${variant === 'sheet' ? styles.symbolListWrapperSheet : ''}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                <div className={styles.symbolListSearch}>
                    <FiSearch
                        className={styles.symbolListSearchIcon}
                        size={15}
                    />
                    <input
                        autoFocus
                        type='text'
                        placeholder='Search tokens...'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={inputKeyHandler}
                    />
                    {searchQuery.length > 0 && (
                        <IoCloseOutline
                            className={styles.symbolListSearchClose}
                            onClick={() => setSearchQuery('')}
                            size={18}
                        />
                    )}
                </div>
                {filterTabs}

                <SymbolListTableHeader
                    sortClickHandler={sortClickHandler}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                />
                {coinsToShow.length > 0 ? (
                    <div className={styles.symbolList}>
                        {coinsToShow.map((c) => (
                            <SymbolListTableRow
                                key={c.coin}
                                symbol={c}
                                symbolSelectListener={symbolSelectListener}
                            />
                        ))}
                    </div>
                ) : (
                    <div className={styles.symbolListEmpty}>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <MdSearchOff
                                className={styles.symbolListEmptyIcon}
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, delay: 0.2 }}
                        >
                            No results found
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </>
    );
};

export default SymbolList;
