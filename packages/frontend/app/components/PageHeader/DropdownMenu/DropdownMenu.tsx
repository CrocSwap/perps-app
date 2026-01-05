import {
    FaDiscord,
    FaCommentAlt,
    FaUserSecret,
    FaFileAlt,
    FaKeyboard,
} from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import packageJson from '../../../../package.json';
import styles from './DropdownMenu.module.css';
import { externalURLs } from '~/utils/Constants';
import { t } from 'i18next';
import { useLocation, useNavigate } from 'react-router';
import { animate, motion, useMotionValue, type PanInfo } from 'framer-motion';
import useMediaQuery from '~/hooks/useMediaQuery';
import { useEffect, useRef } from 'react';
import { useKeyboardShortcuts } from '~/contexts/KeyboardShortcutsContext';

interface DropdownMenuProps {
    setIsDropdownMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onFeedbackClick: () => void;
}

const SIDEBAR_WIDTH = 320;

const SNAP = {
    type: 'tween' as const,
    duration: 0.06,
    ease: [0, 0, 1, 1] as const,
};

const DropdownMenu = ({
    setIsDropdownMenuOpen,
    onFeedbackClick,
}: DropdownMenuProps) => {
    const sessionState = useSession();
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * Drawer position
     */
    const x = useMotionValue(SIDEBAR_WIDTH);

    const isMobile = useMediaQuery('(max-width: 768px)');
    const initialPathRef = useRef(location.pathname);
    useEffect(() => {
        // Skip the initial mount - only close on actual route changes
        if (location.pathname === initialPathRef.current) {
            return;
        }
        // Close immediately on route change
        if (!isMobile) {
            setIsDropdownMenuOpen(false);
            return;
        }

        animate(x, SIDEBAR_WIDTH, {
            ...SNAP,
            onComplete: () => setIsDropdownMenuOpen(false),
        });
    }, [location.pathname]);

    /**
     * Open immediately on mount
     */
    useEffect(() => {
        if (isMobile) {
            animate(x, 0, SNAP);
        }
    }, [isMobile, x]);

    /**
     * Close helper
     */
    const closeMenu = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (!isMobile) {
            setIsDropdownMenuOpen(false);
            return;
        }

        animate(x, SIDEBAR_WIDTH, {
            ...SNAP,
            onComplete: () => setIsDropdownMenuOpen(false),
        });
    };

    /**
     * Drag release logic
     */
    const handleDragEnd = (
        _: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo,
    ) => {
        const shouldClose =
            info.offset.x > SIDEBAR_WIDTH * 0.2 || info.velocity.x > 300;

        animate(x, shouldClose ? SIDEBAR_WIDTH : 0, {
            ...SNAP,
            onComplete: shouldClose
                ? () => setIsDropdownMenuOpen(false)
                : undefined,
        });
    };

    const handleFeedbackClick = () => {
        onFeedbackClick();
        closeMenu();
    };

    const { open: openKeyboardShortcuts } = useKeyboardShortcuts();

    const handleKeyboardShortcutsClick = () => {
        openKeyboardShortcuts();
        closeMenu();
    };

    const menuItems = [
        {
            name: '𝕏 / Twitter',
            icon: <RiTwitterXFill />,
            url: externalURLs.twitter,
        },
        {
            name: 'Discord',
            icon: <FaDiscord />,
            url: externalURLs.discord,
        },
        {
            name: t('feedback.menuLabel'),
            icon: <FaCommentAlt />,
            onClick: handleFeedbackClick,
        },
        {
            name: t('keyboardShortcuts.menuLabel'),
            icon: <FaKeyboard />,
            onClick: handleKeyboardShortcutsClick,
        },
        {
            name: t('docs.menuPrivacy'),
            icon: <FaUserSecret />,
            url: '/v2/privacy',
        },
        {
            name: t('docs.menuTerms'),
            icon: <FaFileAlt />,
            url: '/v2/terms',
        },
    ];

    const handleItemClick = (item: (typeof menuItems)[number]) => {
        if (item.url) {
            const currentPath = window.location.pathname;

            const samePage =
                (item.url.startsWith('/v2/privacy') ||
                    item.url.startsWith('/v2/terms')) &&
                (currentPath.startsWith('/v2/privacy') ||
                    currentPath.startsWith('/v2/terms'));

            if (samePage) {
                navigate(item.url);
            } else {
                window.open(item.url, '_blank');
            }
        } else if (item.onClick) {
            item.onClick();
        }

        closeMenu();
    };

    /**
     * Desktop
     */
    if (!isMobile) {
        return (
            <div className={styles.backdrop} onClick={closeMenu}>
                <div
                    className={styles.container}
                    onClick={(e) => e.stopPropagation()}
                >
                    {menuItems.map((item, index) => (
                        <button
                            key={`${item.name}-${index}`}
                            className={styles.menuItem}
                            onClick={() => handleItemClick(item)}
                        >
                            <span className={styles.menuItemLabel}>
                                {item.name}
                            </span>
                            <span className={styles.menuItemIcon}>
                                {item.icon}
                            </span>
                        </button>
                    ))}
                    <div className={styles.version}>
                        {t('newVersion.version')}:{' '}
                        {packageJson.version.split('-')[0]}
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Mobile
     */
    return (
        <motion.div
            className={styles.backdrop}
            onClick={closeMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05, ease: [0, 0, 1, 1] }}
        >
            <motion.div
                className={styles.container}
                onClick={(e) => e.stopPropagation()}
                style={{ x }}
                drag='x'
                dragDirectionLock
                dragConstraints={{ left: 0, right: SIDEBAR_WIDTH }}
                dragElastic={0}
                onDragEnd={handleDragEnd}
            >
                <section className={styles.menuItems}>
                    {menuItems.map((item, index) => (
                        <button
                            key={`${item.name}-${index}`}
                            className={styles.menuItem}
                            onClick={() => handleItemClick(item)}
                        >
                            <span className={styles.menuItemLabel}>
                                {item.name}
                            </span>
                            <span className={styles.menuItemIcon}>
                                {item.icon}
                            </span>
                        </button>
                    ))}
                </section>
                {isEstablished(sessionState) && (
                    <div className={styles.logoutButtonContainer}>
                        <button
                            className={styles.logoutButton}
                            onClick={() => {
                                sessionState.endSession();
                                setIsDropdownMenuOpen(false);
                            }}
                        >
                            {t('navigation.logout')}
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default DropdownMenu;
