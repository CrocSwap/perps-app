import { useState } from 'react';
import { LuChevronDown, LuChevronUp, LuMenu, LuSettings, LuWallet } from 'react-icons/lu';
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
export default function PageHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);
    const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
    const [isUserConnected, setIsUserConnected] = useState(false);
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
            <Button
                size='medium'
                selected
                onClick={() => setIsDepositDropdownOpen(!isDepositDropdownOpen)}
            >
                Deposit
            </Button>

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
                { isMoreDropdownOpen ? <LuChevronUp /> :<LuChevronDown />
}

            </button>
            {isMoreDropdownOpen && <MoreDropdown />}
        </section>
    );

    const appSettingsModal: useModalIF = useModal('closed');

    return (
        <>
            <section className={styles.mainContainer}>

           
            <header id={'pageHeader'} className={styles.container}>
                <Link to='/'>
                    <img
                        src='/images/perpsLogo.svg'
                        alt='Perps Logo'
                        width='240px'
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
                        <Button
                            size='medium'
                            selected
                            onClick={() => setIsUserConnected(true)}
                        >
                            Connect
                        </Button>
                    )}
                    {isUserConnected && walletDisplay}

                    <button
                        className={styles.internationalButton}
                        onClick={appSettingsModal.open}
                    >
                        <LuSettings size={20} />
                    </button>

                    <button
                        className={styles.menuButtonMobile}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <LuMenu size={20} />
                    </button>
                </div>
            {dropdownMenuDisplay}
            </header>
               
                </section>

            {appSettingsModal.isOpen && (
                <Modal close={appSettingsModal.close} position={'center'} title='Options'>
                    <AppOptions modalControl={appSettingsModal} />
                </Modal>
            )}
        </>
    );
}

