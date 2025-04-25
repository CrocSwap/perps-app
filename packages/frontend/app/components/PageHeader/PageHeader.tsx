import { useState } from 'react';
import { LuMenu, LuSettings, LuWallet } from 'react-icons/lu';
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
            </button>
            {isMoreDropdownOpen && <MoreDropdown />}
        </section>
    );

    const appSettingsModal: useModalIF = useModal('closed');

    return (
        <>
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
            </header>

            {dropdownMenuDisplay}
            {appSettingsModal.isOpen && (
                <Modal close={appSettingsModal.close} position={'center'}>
                    <AppOptions modalControl={appSettingsModal} />
                </Modal>
            )}
        </>
    );
}

// const internationalButtonSvg = (
//     <svg
//         xmlns='http://www.w3.org/2000/svg'
//         width='17'
//         height='17'
//         viewBox='0 0 17 17'
//         fill='none'
//     >
//         <path
//             d='M14.8602 10.5H11.8335C11.4799 10.5 11.1407 10.6405 10.8907 10.8906C10.6406 11.1406 10.5002 11.4798 10.5002 11.8334V14.86M5.16683 2.72671V3.83337C5.16683 4.36381 5.37754 4.87251 5.75262 5.24759C6.12769 5.62266 6.6364 5.83337 7.16683 5.83337C7.52045 5.83337 7.85959 5.97385 8.10964 6.2239C8.35969 6.47395 8.50016 6.81309 8.50016 7.16671C8.50016 7.90004 9.10016 8.50004 9.8335 8.50004C10.1871 8.50004 10.5263 8.35956 10.7763 8.10952C11.0264 7.85947 11.1668 7.52033 11.1668 7.16671C11.1668 6.43337 11.7668 5.83337 12.5002 5.83337H14.6135M7.8335 15.1334V12.5C7.8335 12.1464 7.69302 11.8073 7.44297 11.5572C7.19292 11.3072 6.85378 11.1667 6.50016 11.1667C6.14654 11.1667 5.8074 11.0262 5.55735 10.7762C5.30731 10.5261 5.16683 10.187 5.16683 9.83337V9.16671C5.16683 8.81309 5.02635 8.47395 4.77631 8.2239C4.52626 7.97385 4.18712 7.83337 3.8335 7.83337H1.86683M15.1668 8.50004C15.1668 12.1819 12.1821 15.1667 8.50016 15.1667C4.81826 15.1667 1.8335 12.1819 1.8335 8.50004C1.8335 4.81814 4.81826 1.83337 8.50016 1.83337C12.1821 1.83337 15.1668 4.81814 15.1668 8.50004Z'
//             strokeLinecap='round'
//             strokeLinejoin='round'
//         />
//     </svg>
// );
