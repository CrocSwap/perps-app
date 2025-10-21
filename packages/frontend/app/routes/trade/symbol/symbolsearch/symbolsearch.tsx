import { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { tokenBackgroundMap } from '~/assets/tokens/tokenBackgroundMap';
import { tokenIcons } from '~/assets/tokens';
import useOutsideClick from '~/hooks/useOutsideClick';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import SymbolList from './symbollist/symbollist';
import styles from './symbolsearch.module.css';
import useMediaQuery from '~/hooks/useMediaQuery';

const SymbolSearch: React.FunctionComponent = () => {
    const { symbol } = useTradeDataStore();
    const [isOpen, setIsOpen] = useState(false);
    const isSymbolSearchClickable = true;
    const isMobile = useMediaQuery('(max-width: 1000px)');

    const symbolSearchBackdropRef = useOutsideClick<HTMLDivElement>(() => {
        setIsOpen(false);
    }, true);
    // Separate ref for the mobile sheet so inside clicks don’t close it.
    const sheetRef = useRef<HTMLDivElement | null>(null);
    // useOutsideClick<HTMLDivElement>(
    //     () => {
    //         if (!isMobile) return;
    //         setIsOpen(false);
    //     },
    //     true,
    //     sheetRef,
    // );

    const wrapperClickHandler = () => {
        setIsOpen(!isOpen);
    };

    const symbolFileName = useMemo(() => {
        const match = symbol.match(/^k([A-Z]+)$/);
        return match ? match[1] : symbol;
    }, [symbol]);
    useEffect(() => {
        if (!isMobile) return;
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, isMobile]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bgType = tokenBackgroundMap[symbolFileName.toUpperCase()] || 'light';
    // Early mobile render branch
    if (isMobile && isOpen) {
        return (
            <div className={styles.sheetBackdrop}>
                <div className={styles.sheet}>
                    <div className={styles.sheetHeader}>
                        <div className={styles.sheetTitle}>Select Market</div>
                        <button
                            className={styles.sheetClose}
                            onClick={() => setIsOpen(false)}
                            aria-label='Close'
                            type='button'
                        >
                            ✕
                        </button>
                    </div>

                    <div className={styles.sheetContent}>
                        <SymbolList setIsOpen={setIsOpen} variant='sheet' />
                    </div>
                </div>
            </div>
        );
    }

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

                    <div className={styles.symbolName}>{symbol}-USD</div>

                    {isSymbolSearchClickable && (
                        <FaChevronDown
                            className={`${styles.comboBoxIcon} ${isOpen ? styles.comboBoxIconOpen : ''}`}
                        />
                    )}
                </div>

                {!isMobile && isOpen && <SymbolList setIsOpen={setIsOpen} />}
            </div>
        </>
    );
};

export default SymbolSearch;
