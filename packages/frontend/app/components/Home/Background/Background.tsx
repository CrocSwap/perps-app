import ambientMark from './ambient_mark_hollow.svg';
import styles from './Background.module.css';

export function Background() {
    return (
        <div className={styles.background} aria-hidden='true'>
            <div className={styles.layer}>
                <img
                    src={ambientMark}
                    alt=''
                    className={styles.image}
                    loading='lazy'
                />
            </div>
        </div>
    );
}
