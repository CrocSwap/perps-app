import { useState, useRef, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import styles from './TokenDropdown.module.css';

import fusd from './fusd.svg';
// import usde from '../../assets/tokens/usde.svg';
// import usdc from '../../assets/tokens/usdc.svg';
// import usdt from '../../assets/tokens/usdt.svg';
// import dai from '../../assets/tokens/dai.svg';
// import btc from '../../assets/tokens/btc.svg';
// import eth from '../../assets/tokens/eth.svg';

// Define token interface
export interface Token {
    symbol: string;
    name: string;
    logo?: string;
}

// Sample tokens - replace with your actual tokens
export const AVAILABLE_TOKENS: Token[] = [
    { symbol: 'fUSD', name: 'fUSD', logo: fusd },
    // { symbol: 'USDe', name: 'USD Edge', logo: usde },
    // { symbol: 'USDC', name: 'USD Coin', logo: usdc },
    // { symbol: 'USDT', name: 'Tether USD', logo: usdt },
    // { symbol: 'DAI', name: 'Dai Stablecoin', logo: dai },
    // { symbol: 'BTC', name: 'Bitcoin', logo: btc },
    // { symbol: 'ETH', name: 'Ethereum', logo: eth },
];

interface TokenDropdownProps {
    selectedToken: string;
    onTokenSelect: (token: Token) => void;
    disabled?: boolean;
    className?: string;
}

function TokenDropdown({
    selectedToken,
    onTokenSelect,
    disabled = false,
    className = '',
}: TokenDropdownProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Find the selected token object
    const selected =
        AVAILABLE_TOKENS.find((token) => token.symbol === selectedToken) ||
        AVAILABLE_TOKENS[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    const handleTokenSelect = (token: Token) => {
        onTokenSelect(token);
        setIsOpen(false);
    };

    return (
        <div className={`${styles.container} ${className}`} ref={dropdownRef}>
            <button
                type='button'
                className={`${styles.selector} ${disabled ? styles.disabled : ''}`}
                onClick={toggleDropdown}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setIsOpen(false);
                    } else if (e.key === 'ArrowDown' && !isOpen) {
                        e.preventDefault();
                        setIsOpen(true);
                    }
                }}
                aria-haspopup='listbox'
                aria-expanded={isOpen}
                aria-label={t('aria.selectTokenCurrent', {
                    symbol: selected.symbol,
                })}
                disabled={disabled}
            >
                <div className={styles.selectedToken}>
                    {selected.logo && (
                        <img
                            src={selected.logo}
                            alt=''
                            className={styles.tokenLogo}
                        />
                    )}
                    <span>{selected.symbol}</span>
                </div>
                {isOpen ? (
                    <LuChevronUp size={22} aria-hidden='true' />
                ) : (
                    <LuChevronDown size={22} aria-hidden='true' />
                )}
            </button>

            {isOpen && (
                <div className={styles.dropdown} role='listbox'>
                    {AVAILABLE_TOKENS.map((token) => {
                        const isSelected = token.symbol === selectedToken;
                        return (
                            <div
                                key={token.symbol}
                                className={`${styles.tokenItem} ${isSelected ? styles.selected : ''}`}
                                onClick={() => handleTokenSelect(token)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleTokenSelect(token);
                                    } else if (e.key === 'Escape') {
                                        setIsOpen(false);
                                    }
                                }}
                                role='option'
                                aria-selected={isSelected}
                                tabIndex={0}
                            >
                                <div className={styles.tokenLeft}>
                                    {token.logo && (
                                        <img
                                            src={token.logo}
                                            alt=''
                                            className={styles.tokenLogo}
                                        />
                                    )}
                                    <span className={styles.tokenSymbol}>
                                        {token.symbol}
                                    </span>
                                </div>
                                <div className={styles.tokenInfo}>
                                    <span className={styles.tokenName}>
                                        {token.name}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default memo(TokenDropdown);
