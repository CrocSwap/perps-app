import React, { useMemo, useState } from 'react';
import styles from './symbolInfoMobile.module.css';
import SymbolSearch from './symbolsearch/symbolsearch';
import {
    useSymbolInfoFields,
    type SymbolInfoFieldConfig,
} from './useSymbolInfoFields';
import Modal from '~/components/Modal/Modal';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { MdExpandMore } from 'react-icons/md';

const MOBILE_INLINE_KEYS = [
    'mark',
    'change24h',
    'volume24h',
    'openInterest',
] as const;

type MobileInlineKey = (typeof MOBILE_INLINE_KEYS)[number];

const SymbolInfoMobile: React.FC = () => {
    const { fieldConfigs } = useSymbolInfoFields({ isMobile: true });
    const { getBsColor } = useAppSettings();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const inlineFields = useMemo(
        () =>
            fieldConfigs.filter((field) =>
                MOBILE_INLINE_KEYS.includes(field.key as MobileInlineKey),
            ),
        [fieldConfigs],
    );

    const getValueColor = (field: SymbolInfoFieldConfig) => {
        if (field.type === 'positive') return getBsColor().buy;
        if (field.type === 'negative') return getBsColor().sell;
        return 'var(--text1)';
    };

    const renderInlineField = (field: SymbolInfoFieldConfig) => (
        <div key={field.key} className={styles.InfoField}>
            <p className={styles.fieldLabel}>{field.labelMobile}</p>
            <p
                className={styles.fieldValue}
                style={{ color: getValueColor(field) }}
            >
                {field.value}
            </p>
        </div>
    );

    const ModalContent = (
        <div className={styles.moreModal}>
            <div className={styles.moreModalGrid}>
                {fieldConfigs.map((field) => (
                    <div key={field.key} className={styles.moreCard}>
                        <p className={styles.moreLabel}>{field.label}</p>

                        <p
                            className={styles.moreValue}
                            style={{ color: getValueColor(field) }}
                        >
                            {field.fullValue ?? field.value}
                        </p>

                        {field.tooltipContent && (
                            <p className={styles.moreTooltipText}>
                                {field.tooltipContent && field.tooltipContent}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <>
            <div
                className={styles.container}
                onClick={() => setIsMoreOpen(true)}
            >
                <div
                    className={styles.symbolSelector}
                    id='tutorial-pool-explorer'
                >
                    <SymbolSearch />
                </div>

                <div className={styles.InfoFieldContainer}>
                    {inlineFields.map(renderInlineField)}
                </div>

                <MdExpandMore size={18} />
            </div>

            {isMoreOpen && (
                <Modal
                    title='Market Details'
                    close={() => setIsMoreOpen(false)}
                >
                    {ModalContent}
                </Modal>
            )}
        </>
    );
};

export default SymbolInfoMobile;
