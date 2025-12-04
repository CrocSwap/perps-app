import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useCallback, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import styles from './MobileFooter.module.css';
import { RiHome2Line } from 'react-icons/ri';
import { RxHamburgerMenu } from 'react-icons/rx';
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
    onFeedbackClick: () => void;
}

const MobileFooter: React.FC<MobileFooterProps> = ({ onFeedbackClick }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Refs for outside click handling
    const toggleRef = useRef<HTMLButtonElement>(null);

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
    }, []);

    const menuRef = useOutsideClick<HTMLDivElement>((event) => {
        if (
            toggleRef.current &&
            toggleRef.current.contains(event.target as Node)
        ) {
            return;
        }
        closeMenu();
    }, isMenuOpen);

    // -----------------------------
    // NAVIGATION ITEMS (Bottom row)
    // -----------------------------

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

    // -----------------------------
    // MENU ITEMS (expand up)
    // -----------------------------

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

            if (typeof plausible === 'function') {
                plausible('External Link Clicked', {
                    props: {
                        location: 'mobile-footer',
                        linkType: item.label,
                        url: item.url,
                    },
                });
            }
        } else if (item.type === 'internal' && item.path) {
            navigate(item.path);
        } else if (item.type === 'action' && item.onClick) {
            item.onClick();
        }

        closeMenu();
    };

    // -----------------------------
    // RENDER
    // -----------------------------

    return (
        <motion.nav
            className={styles.footer}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
            {/* EXPANDING PANEL */}
            <AnimatePresence initial={false}>
                {isMenuOpen && (
                    <motion.div
                        ref={menuRef}
                        className={styles.footerMenu}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.18 }}
                    >
                        {menuDisplay.map((item) => (
                            <button
                                key={item.label}
                                className={styles.footerMenuItem}
                                onClick={() => handleMenuItemClick(item)}
                            >
                                <span className={styles.footerMenuLabel}>
                                    {item.label}
                                </span>
                                <span className={styles.footerMenuIcon}>
                                    {item.icon}
                                </span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* BOTTOM ROW */}
            <div className={styles.footerMainRow}>
                <div className={styles.navItemsRow}>
                    {navItems.map((item) => (
                        <NavItem key={item.name} item={item} />
                    ))}
                </div>

                <button
                    ref={toggleRef}
                    type='button'
                    className={`${styles.menuToggle} ${
                        isMenuOpen ? styles.menuToggleActive : ''
                    }`}
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                >
                    <RxHamburgerMenu size={22} />
                </button>
            </div>
        </motion.nav>
    );
};

// -----------------------------
// NAV ITEM COMPONENT
// -----------------------------

const NavItem: React.FC<{ item: NavItem }> = React.memo(({ item }) => {
    const { name, path, icon, end } = item;

    return (
        <NavLink
            to={path}
            end={end}
            className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
            }
        >
            <motion.div
                className={styles.iconWrapper}
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -2 }}
            >
                <div className={styles.icon}>{icon}</div>
                <span className={styles.label}>{name}</span>
            </motion.div>
        </NavLink>
    );
});

// -----------------------------
// ICONS
// -----------------------------

const homeSvg = <RiHome2Line size={23} />;

const tradeSvg = (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='25'
        height='25'
        viewBox='0 0 25 25'
        fill='none'
    >
        <path
            d='M18.84 10.87C19.7853 11.2224 20.6265 11.8075 21.2858 12.5712C21.945 13.3349 22.4011 14.2524 22.6117 15.2391C22.8224 16.2257 22.7809 17.2495 22.491 18.2158C22.2012 19.1822 21.6723 20.0598 20.9534 20.7676C20.2345 21.4754 19.3487 21.9905 18.378 22.2652C17.4072 22.54 16.3829 22.5655 15.3997 22.3395C14.4165 22.1134 13.5061 21.6431 12.7528 20.972C11.9995 20.3009 11.4276 19.4507 11.09 18.5M7.75 6.5H8.75V10.5M17.46 14.38L18.16 15.09L15.34 17.91M14.75 8.5C14.75 11.8137 12.0637 14.5 8.75 14.5C5.43629 14.5 2.75 11.8137 2.75 8.5C2.75 5.18629 5.43629 2.5 8.75 2.5C12.0637 2.5 14.75 5.18629 14.75 8.5Z'
            stroke='currentColor'
            strokeWidth='2.2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
    </svg>
);

export default React.memo(MobileFooter);
