import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import styles from './MobileFooter.module.css';
import { RiHome2Line } from 'react-icons/ri';
import { CgMoreO } from 'react-icons/cg';
import packageJson from '../../../../../package.json';

import {
    FaDiscord,
    FaCommentAlt,
    FaUserSecret,
    FaFileAlt,
} from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';
import { useTranslation } from 'react-i18next';
import { externalURLs } from '~/utils/Constants';
import useOutsideClick from '~/hooks/useOutsideClick';
import { LuSettings } from 'react-icons/lu';
import AppOptions from '../AppOptions/AppOptions';
import PreventPullToRefresh from '~/hooks/PreventPullToRefresh';

interface NavItem {
    name: string;
    path: string;
    icon: React.ReactNode;
    end?: boolean;
}

interface FooterMenuItem {
    label: string;
    icon: React.ReactNode;
    type: 'external' | 'internal' | 'action';
    url?: string;
    path?: string;
    onClick?: () => void;
}

interface MobileFooterProps {
    onFeedbackClick?: () => void;
}

const MobileFooter: React.FC<MobileFooterProps> = ({
    onFeedbackClick = () => {},
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [activePanel, setActivePanel] = useState<
        'none' | 'menu' | 'settings'
    >('none');

    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartY = useRef(0);

    const isMenuOpen = activePanel === 'menu';
    const isSettingsOpen = activePanel === 'settings';
    const isAnyPanelOpen = activePanel !== 'none';

    const footerMainRef = useRef<HTMLDivElement>(null);

    const resetDragState = useCallback(() => {
        setDragY(0);
        setIsDragging(false);
    }, []);

    const closePanel = useCallback(() => {
        setActivePanel('none');
        resetDragState();
    }, [resetDragState]);

    const handleDragStart = useCallback((e: React.PointerEvent) => {
        setIsDragging(true);
        dragStartY.current = e.clientY;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, []);

    const handleDragMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isDragging) return;
            const deltaY = e.clientY - dragStartY.current;
            setDragY(Math.max(0, deltaY));
        },
        [isDragging],
    );

    const handleDragEnd = useCallback(
        (e: React.PointerEvent) => {
            if (!isDragging) return;
            setIsDragging(false);
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);

            if (dragY > 50) {
                closePanel();
            } else {
                setDragY(0);
            }
        },
        [isDragging, dragY, closePanel],
    );

    const menuToggleRef = useRef<HTMLButtonElement>(null);
    const settingsToggleRef = useRef<HTMLButtonElement>(null);

    const panelRef = useOutsideClick<HTMLDivElement>((event) => {
        const target = event.target as Node;

        if (
            menuToggleRef.current?.contains(target) ||
            settingsToggleRef.current?.contains(target) ||
            footerMainRef.current?.contains(target)
        ) {
            return;
        }

        closePanel();
    }, isAnyPanelOpen);

    const navItems: NavItem[] = [
        {
            name: t('navigation.home'),
            path: '/',
            icon: homeSvg,
            end: true,
        },
        {
            name: t('navigation.trade'),
            path: '/v2/trade',
            icon: tradeSvg,
        },
    ];

    const handleNavItemClick = useCallback(
        (item: NavItem) => {
            if (item.path === '/v2/trade') {
                window.dispatchEvent(new Event('trade:nav:trade'));
            }
            closePanel();
        },
        [closePanel],
    );

    const menuDisplay: FooterMenuItem[] = [
        {
            label: '𝕏 / Twitter',
            icon: <RiTwitterXFill />,
            type: 'external',
            url: externalURLs.twitter,
        },
        {
            label: 'Discord',
            icon: <FaDiscord />,
            type: 'external',
            url: externalURLs.discord,
        },
        {
            label: t('feedback.menuLabel'),
            icon: <FaCommentAlt />,
            type: 'action',
            onClick: onFeedbackClick,
        },
        {
            label: t('docs.menuPrivacy'),
            icon: <FaUserSecret />,
            type: 'internal',
            path: '/v2/privacy',
        },
        {
            label: t('docs.menuTerms'),
            icon: <FaFileAlt />,
            type: 'internal',
            path: '/v2/terms',
        },
    ];

    const handleMenuItemClick = (item: FooterMenuItem) => {
        if (item.type === 'external' && item.url) {
            window.open(item.url, '_blank');
        } else if (item.type === 'internal' && item.path) {
            navigate(item.path);
        } else if (item.type === 'action' && item.onClick) {
            item.onClick();
        }
        closePanel();
    };

    const toggleMenuPanel = () => {
        setActivePanel((prev) => (prev === 'menu' ? 'none' : 'menu'));
        resetDragState();
    };

    const toggleSettingsPanel = () => {
        setActivePanel((prev) => (prev === 'settings' ? 'none' : 'settings'));
        resetDragState();
    };

    return (
        <PreventPullToRefresh>
            <motion.nav
                className={styles.footer}
                animate={{ y: isAnyPanelOpen ? dragY : 0 }}
                transition={{ y: { duration: isDragging ? 0 : 0.2 } }}
            >
                <AnimatePresence initial={false}>
                    {isAnyPanelOpen && (
                        <motion.div
                            ref={panelRef}
                            className={styles.footerPanel}
                            onPointerDown={handleDragStart}
                            onPointerMove={handleDragMove}
                            onPointerUp={handleDragEnd}
                            onPointerCancel={handleDragEnd}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{
                                height: 'auto',
                                opacity: 1,
                                transition: {
                                    height: { duration: 0.2 },
                                    opacity: { duration: 0.15 },
                                },
                            }}
                            exit={{
                                height: 0,
                                opacity: 0,
                                transition: { duration: 0.15 },
                            }}
                        >
                            <div className={styles.dragHandle}>
                                <div className={styles.dragBar} />
                            </div>

                            {isMenuOpen && (
                                <div className={styles.footerMenu}>
                                    {menuDisplay.map((item) => (
                                        <button
                                            key={item.label}
                                            className={styles.footerMenuItem}
                                            onClick={() =>
                                                handleMenuItemClick(item)
                                            }
                                        >
                                            <span
                                                className={
                                                    styles.footerMenuLabel
                                                }
                                            >
                                                {item.label}
                                            </span>
                                            <span
                                                className={
                                                    styles.footerMenuIcon
                                                }
                                            >
                                                {item.icon}
                                            </span>
                                        </button>
                                    ))}
                                    <div className={styles.version}>
                                        {t('newVersion.version')}:{' '}
                                        {packageJson.version.split('-')[0]}
                                    </div>
                                </div>
                            )}

                            {isSettingsOpen && (
                                <div className={styles.footerSettings}>
                                    <AppOptions
                                        footer
                                        closePanel={closePanel}
                                    />
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={footerMainRef} className={styles.footerMainRow}>
                    <div className={styles.navItemsRow}>
                        {navItems.map((item) => (
                            <NavItem
                                key={item.name}
                                item={item}
                                onClick={() => handleNavItemClick(item)}
                            />
                        ))}

                        <button
                            ref={settingsToggleRef}
                            className={`${styles.navItem} ${isSettingsOpen ? styles.active : ''}`}
                            onClick={toggleSettingsPanel}
                        >
                            <div className={styles.iconWrapper}>
                                <div className={styles.icon}>
                                    <LuSettings size={23} />
                                </div>
                                <span className={styles.label}>
                                    {t('navigation.settings')}
                                </span>
                            </div>
                        </button>
                    </div>
                </div>
            </motion.nav>
        </PreventPullToRefresh>
    );
};

const NavItem: React.FC<{ item: NavItem; onClick?: () => void }> = React.memo(
    ({ item, onClick }) => (
        <NavLink
            to={item.path}
            end={item.end}
            onClick={onClick}
            className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
            }
        >
            <div className={styles.iconWrapper}>
                <div className={styles.icon}>{item.icon}</div>
                <span className={styles.label}>{item.name}</span>
            </div>
        </NavLink>
    ),
);

const homeSvg = <RiHome2Line size={23} />;

const tradeSvg = (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='25'
        height='25'
        viewBox='0 0 25 25'
        fill='none'
    >
        {' '}
        <path
            d='M18.84 10.87C19.7853 11.2224 20.6265 11.8075 21.2858 12.5712C21.945 13.3349 22.4011 14.2524 22.6117 15.2391C22.8224 16.2257 22.7809 17.2495 22.491 18.2158C22.2012 19.1822 21.6723 20.0598 20.9534 20.7676C20.2345 21.4754 19.3487 21.9905 18.378 22.2652C17.4072 22.54 16.3829 22.5655 15.3997 22.3395C14.4165 22.1134 13.5061 21.6431 12.7528 20.972C11.9995 20.3009 11.4276 19.4507 11.09 18.5M7.75 6.5H8.75V10.5M17.46 14.38L18.16 15.09L15.34 17.91M14.75 8.5C14.75 11.8137 12.0637 14.5 8.75 14.5C5.43629 14.5 2.75 11.8137 2.75 8.5C2.75 5.18629 5.43629 2.5 8.75 2.5C12.0637 2.5 14.75 5.18629 14.75 8.5Z'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />{' '}
    </svg>
);

export default React.memo(MobileFooter);
