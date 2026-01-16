import { useMemo, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { tokenBackgroundMap } from '~/assets/tokens/tokenBackgroundMap';
import { tokenIcons } from '~/assets/tokens';
import useOutsideClick from '~/hooks/useOutsideClick';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import SymbolList from './symbollist/symbollist';
import styles from './symbolsearch.module.css';

const SymbolSearch: React.FunctionComponent = () => {
    const { symbol } = useTradeDataStore();
    const [isOpen, setIsOpen] = useState(false);
    const isSymbolSearchClickable = false;

    const symbolSearchBackdropRef = useOutsideClick<HTMLDivElement>(() => {
        setIsOpen(false);
    }, true);

    const wrapperClickHandler = () => {
        setIsOpen(!isOpen);
    };

    const symbolFileName = useMemo(() => {
        const match = symbol.match(/^k([A-Z]+)$/);
        return match ? match[1] : symbol;
    }, [symbol]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bgType = tokenBackgroundMap[symbolFileName.toUpperCase()] || 'light';

    return (
        <>
            <div
                className={styles.symbolSearchBackdrop}
                ref={symbolSearchBackdropRef}
            >
                <div
                    className={styles.symbolSearchContainer}
                    onClick={
                        isSymbolSearchClickable
                            ? wrapperClickHandler
                            : undefined
                    }
                >
                    <div
                        className={styles.symbolIcon}
                        // style={{
                        //     background: `var(--${bgType === 'light' ? 'text1' : 'bg-dark1'})`,
                        // }}
                    >
                        <img
                            src={
                                tokenIcons[symbolFileName.toUpperCase()] ||
                                `https://app.hyperliquid.xyz/coins/${symbolFileName}.svg`
                            }
                            alt={symbolFileName}
                        />
                    </div>

                    <div className={styles.symbolName}>
                        {symbol}-<p>USD</p>
                    </div>

                    {isSymbolSearchClickable && (
                        <FaChevronDown
                            className={`${styles.comboBoxIcon} ${isOpen ? styles.comboBoxIconOpen : ''}`}
                        />
                    )}
                </div>

                {isOpen && <SymbolList setIsOpen={setIsOpen} />}
            </div>
        </>
    );
};

export default SymbolSearch;
