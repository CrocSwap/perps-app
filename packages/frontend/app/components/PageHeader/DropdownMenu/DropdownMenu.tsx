import { FaDiscord, FaCommentAlt } from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';
// import { IoIosInformationCircle } from 'react-icons/io';
// import { useTutorial } from '~/hooks/useTutorial';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import packageJson from '../../../../package.json';
import styles from './DropdownMenu.module.css';
import { externalURLs } from '~/utils/Constants';
import { t } from 'i18next';

interface DropdownMenuProps {
    setIsDropdownMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    onFeedbackClick: () => void;
}

const DropdownMenu = ({
    setIsDropdownMenuOpen,
    onFeedbackClick,
}: DropdownMenuProps) => {
    const sessionState = useSession();

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
        // { name: 'Medium', icon: <FaMediumM /> },
        // { name: 'Privacy', icon: <FaUserSecret /> },
        // { name: 'Terms of Service', icon: <FaFileAlt /> },
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
                            window.open(item.url, '_blank');
                            if (typeof plausible === 'function') {
                                plausible('External Link Clicked', {
                                    props: {
                                        location: 'dropdown-menu',
                                        name: item.name,
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
                Version: {packageJson.version.split('-')[0]}
            </div>
            {isEstablished(sessionState) && (
                <button
                    className={styles.logoutButton}
                    onClick={() => {
                        sessionState.endSession();
                        setIsDropdownMenuOpen(false);
                    }}
                >
                    Log Out
                </button>
            )}
        </div>
    );
};

export default DropdownMenu;
