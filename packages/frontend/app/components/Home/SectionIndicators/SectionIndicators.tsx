import { memo } from 'react';
import styles from './SectionIndicators.module.css';
import type { PresetId } from '../types';

interface SectionIndicatorsProps {
    presets: readonly PresetId[];
    currentPreset: PresetId;
    onSelectPreset: (preset: PresetId) => void;
}

export const SectionIndicators = memo(function SectionIndicators({
    presets,
    currentPreset,
    onSelectPreset,
}: SectionIndicatorsProps) {
    return (
        <div className={styles.sectionIndicator}>
            {presets.map((preset) => {
                const isActive = preset === currentPreset;
                return (
                    <button
                        key={preset}
                        type='button'
                        className={`${styles.indicatorDot} ${
                            isActive ? styles.indicatorDotActive : ''
                        }`}
                        onClick={() => onSelectPreset(preset)}
                        aria-label={`Go to ${preset}`}
                    />
                );
            })}
        </div>
    );
});

SectionIndicators.displayName = 'SectionIndicators';
