import { t } from 'i18next';
import styles from './RunningTime.module.css';

export default function RunningTime() {
    return (
        <div className={styles.container}>
            <h3 className={styles.label}>Running Time (5m - 24h)</h3>
            <div className={styles.inputContainer}>
                <input
                    type='text'
                    // value={value}
                    onChange={(e) => console.log(e)}
                    aria-label={t('aria.runningPriceInput.hours')}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    placeholder='Hour(s)'
                />
                <div className={styles.runningPriceMinutes}>
                    <input
                        type='text'
                        // value={value}
                        onChange={(e) => console.log(e)}
                        aria-label={t('aria.runningPriceInput.minutes')}
                        inputMode='numeric'
                        pattern='[0-9]*'
                        placeholder='Minute(s)'
                    />
                    <span>30</span>
                </div>
            </div>
        </div>
    );
}
