import type { MarginMode } from '../OrderInput';
import styles from './MarginModal.module.css';

interface PropsIF {
    handleMarginModeChange: (mode: MarginMode) => void;
    handleMarginModeConfirm: () => void;
    activeMargin: MarginMode;
}
export default function MarginModal(props: PropsIF) {
    const { handleMarginModeChange, handleMarginModeConfirm, activeMargin } =
        props;

    return (
        <section className={styles.container}>
            <div className={styles.contentContainer}>
                <button
                    className={`${styles.content} ${activeMargin === 'cross' ? styles.selected : ''}`}
                    onClick={() => handleMarginModeChange('cross')}
                >
                    <h3>Cross Margin</h3>
                    <p>
                        All cross positions share the same cross margin as
                        collateral. In the event of liquidation, your cross
                        margin balance and any remaining open positions under
                        assets in this mode may be forfeited.
                    </p>
                </button>
                <button
                    className={`${styles.content} ${activeMargin === 'isolated' ? styles.selected : ''}`}
                    onClick={() => handleMarginModeChange('isolated')}
                >
                    <h3>Isolated Mode</h3>
                    <p>
                        Manage your risk on individual positions by restricting
                        the amount of margin allocated to each. If the margin
                        ratio of an isolated position reaches 100%, the position
                        will be liquidated. Margin can be added or removed to
                        individual positions in this mode.
                    </p>
                </button>
            </div>
            <button
                className={styles.confirmButton}
                onClick={() => handleMarginModeConfirm()}
            >
                Confirm
            </button>
        </section>
    );
}
