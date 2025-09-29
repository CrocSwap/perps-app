import styles from './LogoLoadingIndicator.module.css';
import { t } from 'i18next';

export default function LogoLoadingIndicator() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.logoMask} aria-label={t('common.loading')} />
        </div>
    );
}
