import { useState } from 'react';
import {
    LuChevronDown,
    LuChevronUp,
    LuSettings,
    LuWallet,
} from 'react-icons/lu';
import { MdOutlineClose, MdOutlineMoreHoriz } from 'react-icons/md';
import { Link, useLocation } from 'react-router';
import { type useModalIF, useModal } from '~/hooks/useModal';
import useOutsideClick from '~/hooks/useOutsideClick';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import AppOptions from '../AppOptions/AppOptions';
import Button from '../Button/Button';
import Modal from '../Modal/Modal';
import DepositDropdown from './DepositDropdown/DepositDropdown';
import DropdownMenu from './DropdownMenu/DropdownMenu';
import MoreDropdown from './MoreDropdown/MoreDropdown';
import NetworkDropdown from './NetworkDropdown/NetworkDropdown';
import styles from './PageHeader.module.css';
import RpcDropdown from './RpcDropdown/RpcDropdown';
import WalletDropdown from './WalletDropdown/WalletDropdown';
import { useApp } from '~/contexts/AppContext';
export default function PageHeader() {
    const { isUserConnected, setIsUserConnected } = useApp();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);
    const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
    const [isRpcDropdownOpen, setIsRpcDropdownOpen] = useState(false);
    const [isDepositDropdownOpen, setIsDepositDropdownOpen] = useState(false);
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
    const location = useLocation();

    const { symbol } = useTradeDataStore();

    const navLinks = [
        { name: 'Trade', path: `/trade/${symbol}` },
        { name: 'Vaults', path: '/vaults' },
        { name: 'Portfolio', path: '/portfolio' },
        { name: 'Referrals', path: '/referrals' },
        // { name: 'Points', path: '/points' },
        { name: 'Leaderboard', path: '/leaderboard' },
        // { name: 'Strategies', path: '/strategies' },
    ];

    const dropdownMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsDropdownMenuOpen(false);
    }, isDropdownMenuOpen);
    const mobileNavbarRef = useOutsideClick<HTMLDivElement>(() => {
        setIsMenuOpen(false);
    }, isMenuOpen);
    const walletMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsWalletMenuOpen(false);
    }, isWalletMenuOpen);
    const rpcMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsRpcDropdownOpen(false);
    }, isRpcDropdownOpen);
    const depositMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsDepositDropdownOpen(false);
    }, isDepositDropdownOpen);
    const networkMenuRef = useOutsideClick<HTMLDivElement>(() => {
        setIsNetworkDropdownOpen(false);
    }, isNetworkDropdownOpen);
    const moreDropdownRef = useOutsideClick<HTMLDivElement>(() => {
        setIsMoreDropdownOpen(false);
    }, isMoreDropdownOpen);

    const walletDisplay = (
        <section
            style={{
                position: 'relative',
            }}
            ref={walletMenuRef}
        >
            {isUserConnected && (
                <button
                    className={styles.walletButton}
                    onClick={() => setIsWalletMenuOpen(!isWalletMenuOpen)}
                >
                    <LuWallet size={18} /> Miyuki.eth
                </button>
            )}

            {isWalletMenuOpen && isUserConnected && (
                <WalletDropdown
                    isWalletMenuOpen={isWalletMenuOpen}
                    setIsWalletMenuOpen={setIsWalletMenuOpen}
                    setIsUserConnected={setIsUserConnected}
                    isDropdown
                />
            )}
        </section>
    );

    const dropdownMenuDisplay = (
        <section
            style={{
                position: 'relative',
            }}
            ref={dropdownMenuRef}
        >
            <button
                className={styles.menuButton}
                onClick={() => setIsDropdownMenuOpen(!isDropdownMenuOpen)}
            >
                <MdOutlineMoreHoriz size={20} />
            </button>
            {isDropdownMenuOpen && <DropdownMenu />}
        </section>
    );

    const rpcDisplay = (
        <section
            style={{
                position: 'relative',
            }}
            ref={rpcMenuRef}
        >
            {isUserConnected && (
                <button
                    className={styles.rpcButton}
                    onClick={() => setIsRpcDropdownOpen(!isRpcDropdownOpen)}
                >
                    RPC
                    <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='16'
                        height='16'
                        viewBox='0 0 16 16'
                        fill='none'
                    >
                        <circle cx='8' cy='8' r='8' fill='#26A69A' />
                    </svg>
                </button>
            )}

            {isRpcDropdownOpen && isUserConnected && <RpcDropdown />}
        </section>
    );

    const depositDisplay = (
        <section
            style={{
                position: 'relative',
            }}
            ref={depositMenuRef}
        >
            <button
                className={styles.depositButton}
                onClick={() => setIsDepositDropdownOpen(!isDepositDropdownOpen)}
            >
                Deposit
            </button>

            {isDepositDropdownOpen && (
                <DepositDropdown
                    isUserConnected={isUserConnected}
                    setIsUserConnected={setIsUserConnected}
                    isDropdown
                />
            )}
        </section>
    );
    const networksDisplay = (
        <section
            style={{
                position: 'relative',
            }}
            ref={networkMenuRef}
        >
            <button
                className={styles.networkButton}
                onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
            >
                Ethereum
            </button>

            {isNetworkDropdownOpen && <NetworkDropdown />}
        </section>
    );

    const moreDropdownDisplay = (
        <section
            style={{
                position: 'relative',
            }}
            ref={moreDropdownRef}
        >
            <button
                className={styles.moreButton}
                onClick={() => setIsMoreDropdownOpen(!isMoreDropdownOpen)}
            >
                more
                {isMoreDropdownOpen ? <LuChevronUp /> : <LuChevronDown />}
            </button>
            {isMoreDropdownOpen && (
                <MoreDropdown setIsMoreDropdownOpen={setIsMoreDropdownOpen} />
            )}
        </section>
    );

    const appSettingsModal: useModalIF = useModal('closed');

    return (
        <>
            <header id={'pageHeader'} className={styles.container}>
                <Link to='/' style={{ marginLeft: '10px' }} viewTransition>
                    <img
                        src='/images/favicon.svg'
                        alt='Perps Logo'
                        width='90px'
                        height='90px'
                    />
                </Link>
                <nav
                    className={`${styles.nav} ${
                        isMenuOpen ? styles.showMenu : ''
                    }`}
                    ref={isMenuOpen ? mobileNavbarRef : null}
                >
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className={styles.mobileNavCloseButton}
                    >
                        <MdOutlineClose size={20} color='var(--text1)' />
                    </button>
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={
                                location.pathname.includes(link.path)
                                    ? styles.activeNavLink
                                    : styles.navLink
                            }
                            onClick={() => {
                                if (isMenuOpen) setIsMenuOpen(false);
                            }}
                            viewTransition
                        >
                            {link.name}
                        </Link>
                    ))}
                    {moreDropdownDisplay}
                </nav>
                <div className={styles.rightSide}>
                    {isUserConnected && depositDisplay}
                    {isUserConnected && networksDisplay}
                    {isUserConnected && rpcDisplay}
                    {!isUserConnected && (
                        <button
                            className={styles.depositButton}
                            onClick={() => setIsUserConnected(true)}
                        >
                            Connect
                        </button>
                    )}
                    {isUserConnected && walletDisplay}

                    <button
                        className={styles.internationalButton}
                        onClick={appSettingsModal.open}
                    >
                        <LuSettings size={20} />
                    </button>

                    {dropdownMenuDisplay}
                </div>
            </header>

            {appSettingsModal.isOpen && (
                <Modal
                    close={appSettingsModal.close}
                    position={'center'}
                    title='Options'
                >
                    <AppOptions />
                </Modal>
            )}
        </>
    );
}
