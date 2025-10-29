import { useTranslation } from 'react-i18next';
import styles from '../Copy.module.css';
import type { PresetId } from '../../types';
import type { HeroSlideConfig } from '../../config/overlay-config';
import { useTradeDataStore } from '~/stores/TradeDataStore';

interface HeroSlideProps {
    slide: HeroSlideConfig;
    headingId: string;
    onScrollToPreset: (preset: PresetId) => void;
}

export function HeroSlide({
    slide,
    headingId,
    onScrollToPreset,
}: HeroSlideProps) {
    const { t } = useTranslation();
    const { symbol } = useTradeDataStore();
    const handleSecondaryCtaClick = () => {
        if (slide.ctaSecondary.action === 'scrollTo') {
            onScrollToPreset(slide.ctaSecondary.target);
        }
    };

    const ctaHref =
        slide.ctaPrimary.labelKey === 'home.startTrading'
            ? `/v2/trade/${symbol}`
            : slide.ctaPrimary.href;

    return (
        <>
            <div className={styles.heroContent}>
                <div className={styles.heroText}>
                    <h1 id={headingId} className={styles.heroTitle}>
                        {slide.title}
                        {slide.accent ? (
                            <>
                                {' '}
                                <span className={styles.accent}>
                                    {slide.accent}
                                </span>
                            </>
                        ) : null}
                    </h1>
                    {slide.subtitle ? (
                        <p className={styles.heroSubtitle}>{slide.subtitle}</p>
                    ) : null}
                </div>
                <div className={styles.overlayActions}>
                    <a href={ctaHref} className={styles.ctaPrimary}>
                        {t(slide.ctaPrimary.labelKey)}
                    </a>
                    {slide.ctaSecondary.action === 'scrollTo' ? (
                        <button
                            className={styles.ctaSecondary}
                            onClick={handleSecondaryCtaClick}
                        >
                            {slide.ctaSecondary.label}
                        </button>
                    ) : null}
                </div>
            </div>
        </>
    );
}
