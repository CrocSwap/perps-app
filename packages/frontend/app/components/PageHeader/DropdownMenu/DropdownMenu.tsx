import {
    FaDiscord,
    FaCommentAlt,
    FaUserSecret,
    FaFileAlt,
} from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';
// import { IoIosInformationCircle } from 'react-icons/io';
// import { useTutorial } from '~/hooks/useTutorial';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import packageJson from '../../../../package.json';
import styles from './DropdownMenu.module.css';
import { externalURLs } from '~/utils/Constants';
import { t } from 'i18next';
import { useNavigate } from 'react-router';

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
    const handleFeedbackClick = () => {
        onFeedbackClick();
        setIsDropdownMenuOpen(false);
    };

    const menuItems = [
        // { name: 'Docs', icon: <FaFileAlt /> },
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
        // { name: 'Medium', icon: <FaMediumM /> },
        // { name: 'FAQ', icon: <LuCircleHelp /> },
    ];

    return (
        <div className={styles.container}>
            {menuItems.map((item, index) => (
                <div
                    key={`${item.name}-${index}`}
                    className={styles.menuItem}
                    onClick={() => {
                        if (item.url) {
                            // get current path
                            const currentPath = window.location.pathname;
                            // if user clicks privacy or terms and user is already on privacy or terms, open in same tab
                            if (
                                (item.url.startsWith('/v2/privacy') ||
                                    item.url.startsWith('/v2/terms')) &&
                                (currentPath.startsWith('/v2/privacy') ||
                                    currentPath.startsWith('/v2/terms'))
                            ) {
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
                        setIsDropdownMenuOpen(false);
                    }}
                >
                    <span>{item.name}</span>
                    <span>{item.icon}</span>
                </div>
            ))}
            <div className={styles.version}>
                {t('newVersion.version')}: {packageJson.version.split('-')[0]}
            </div>
            {isEstablished(sessionState) && (
                <button
                    className={styles.logoutButton}
                    onClick={() => {
                        sessionState.endSession();
                        setIsDropdownMenuOpen(false);
                    }}
                >
                    {t('navigation.logout')}
                </button>
            )}
        </div>
    );
};

export default DropdownMenu;
