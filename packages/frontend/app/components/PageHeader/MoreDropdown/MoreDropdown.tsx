import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import styles from './MoreDropdown.module.css';

interface propsIF {
    setIsMoreDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MoreDropdown(props: propsIF) {
    const { t } = useTranslation();
    const { setIsMoreDropdownOpen } = props;
    const submenuData = [
        { name: 'Testnet', path: '/testnet' },
        { name: 'Explorer', path: '/explorer' },
        { name: 'Sub-Accounts', path: '/subaccounts' },
        { name: 'API', path: '/api' },
        { name: 'Multi-Sig', path: '/multi-sig' },
        { name: 'Funding Comparison', path: '/funding-comparison' },
        { name: 'Stats', path: '/stats' },
        { name: 'Docs', path: '/docs' },
        { name: 'Strategies', path: '/strategies' },
    ];

    return (
        <nav
            className={styles.container}
            role='menu'
            aria-label={t('aria.moreOptions')}
        >
            {submenuData.map((menu, idx) => (
                <Link
                    to={menu.path}
                    key={idx}
                    className={styles.row}
                    viewTransition
                    onClick={() => setIsMoreDropdownOpen(false)}
                    role='menuitem'
                >
                    {menu.name}
                </Link>
            ))}
        </nav>
    );
}
