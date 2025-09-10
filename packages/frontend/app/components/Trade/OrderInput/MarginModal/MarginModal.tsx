import { useState } from 'react';
import styles from './MarginModal.module.css';
import { type marginModesT } from '~/stores/TradeDataStore';
import { t } from 'i18next';

interface propsIF {
    initial: marginModesT;
    handleConfirm: (m: marginModesT) => void;
}

export default function MarginModal(props: propsIF) {
    const { initial, handleConfirm } = props;

    // hook to track current user selection until CTA is clicked
    const [intermediate, setIntermediate] = useState<marginModesT>(initial);

    return (
        <section className={styles.margin_modal_content}>
            <div className={styles.margin_buttons}>
                <button
                    className={
                        styles[intermediate === 'cross' ? 'selected' : '']
                    }
                    onClick={() => setIntermediate('cross')}
                >
                    <h3>{t('margin.cross.heading')}</h3>
                    <p>{t('margin.cross.blurb')}</p>
                </button>
                <button
                    className={
                        styles[intermediate === 'isolated' ? 'selected' : '']
                    }
                    onClick={() => setIntermediate('isolated')}
                >
                    <h3>{t('margin.isolated.heading')}</h3>
                    <p>{t('margin.isolated.blurb')}</p>
                </button>
            </div>
            <button onClick={() => handleConfirm(intermediate)}>
                {t('common.confirm')}
            </button>
        </section>
    );
}
