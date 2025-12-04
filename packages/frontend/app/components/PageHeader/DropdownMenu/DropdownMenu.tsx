import {
    FaDiscord,
    FaCommentAlt,
    FaUserSecret,
    FaFileAlt,
} from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import packageJson from '../../../../package.json';
import styles from './DropdownMenu.module.css';
import { externalURLs } from '~/utils/Constants';
import { t } from 'i18next';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import useMediaQuery from '~/hooks/useMediaQuery';
import { useState } from 'react';

interface DropdownMenuProps {
    setIsDropdownMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onFeedbackClick: () => void;
}

const DropdownMenu = ({
    setIsDropdownMenuOpen,
    onFeedbackClick,
}: DropdownMenuProps) => {
    const sessionState = useSession();
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [isClosing, setIsClosing] = useState(false);

    const closeMenu = (e?: React.MouseEvent) => {
        e?.stopPropagation();

        if (isMobile) {
            setIsClosing(true);
            setTimeout(() => {
                setIsDropdownMenuOpen(false);
            }, 150);
        } else {
            setIsDropdownMenuOpen(false);
        }
    };

    const handleFeedbackClick = () => {
        onFeedbackClick();
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

            if (typeof plausible === 'function') {
                plausible('External Link Clicked', {
                    props: {
                        location: 'dropdown-menu',
                        linkType: item.name,
                        url: item.url,
                    },
                });
            }
        } else if (item.onClick) {
            item.onClick();
        }

        closeMenu();
    };

    // Animation variants - only for mobile
    const backdropVariants = {
        visible: { opacity: 1 },
        hidden: { opacity: 0 },
    };

    const containerVariants = {
        visible: { x: 0 },
        hidden: { x: '100%' },
    };

    // Conditionally render with or without animation
    if (!isMobile) {
        return (
            <div className={styles.backdrop} onClick={closeMenu}>
                <div
                    className={styles.container}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.logoRow}>
                        <img
                            src='/logo.svg'
                            alt='Ambient'
                            className={styles.logoImage}
                        />
                    </div>

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

                    {isEstablished(sessionState) && (
                        <button
                            className={styles.logoutButton}
                            onClick={() => {
                                sessionState.endSession();
                                closeMenu();
                            }}
                        >
                            {t('navigation.logout')}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Mobile version with animation
    return (
        <motion.div
            className={styles.backdrop}
            onClick={closeMenu}
            initial='hidden'
            animate={isClosing ? 'hidden' : 'visible'}
            variants={backdropVariants}
            transition={{ duration: 0.15 }}
        >
            <motion.div
                className={styles.container}
                onClick={(e) => e.stopPropagation()}
                initial='hidden'
                animate={isClosing ? 'hidden' : 'visible'}
                variants={containerVariants}
                transition={{
                    duration: 0.15,
                    ease: [0.4, 0, 0.2, 1],
                }}
            >
                <div className={styles.logoRow}>
                    <img
                        src='/images/perpsLogo.svg'
                        alt='Perps Logo'
                        className={styles.logoImage}
                    />
                </div>

                {menuItems.map((item, index) => (
                    <button
                        key={`${item.name}-${index}`}
                        className={styles.menuItem}
                        onClick={() => handleItemClick(item)}
                    >
                        <span className={styles.menuItemLabel}>
                            {item.name}
                        </span>
                        <span className={styles.menuItemIcon}>{item.icon}</span>
                    </button>
                ))}

                <div className={styles.version}>
                    {t('newVersion.version')}:{' '}
                    {packageJson.version.split('-')[0]}
                </div>

                {isEstablished(sessionState) && (
                    <button
                        className={styles.logoutButton}
                        onClick={() => {
                            sessionState.endSession();
                            closeMenu();
                        }}
                    >
                        {t('navigation.logout')}
                    </button>
                )}
            </motion.div>
        </motion.div>
    );
};

export default DropdownMenu;
