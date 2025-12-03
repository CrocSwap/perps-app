import { useTranslation } from 'react-i18next';
import styles from '../Copy.module.css';
import type { PresetId } from '../../types';
import type { HeroSlideConfig } from '../../config/overlay-config';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useTextMorph } from '~/hooks/useTextMorph';

interface HeroSlideProps {
    slide: HeroSlideConfig;
    headingId: string;
    onScrollToPreset: (preset: PresetId) => void;
    isActive: boolean;
}

export function HeroSlide({
    slide,
    headingId,
    onScrollToPreset,
    isActive,
}: HeroSlideProps) {
    const { t } = useTranslation();
    const { symbol } = useTradeDataStore();
    const handleSecondaryCtaClick = () => {
        if (slide.ctaSecondary.action === 'scrollTo') {
            onScrollToPreset(slide.ctaSecondary.target);
        }
    };

    const ctaHref =
        slide.ctaPrimary.labelKey === 'home.tradeNow'
            ? `/v2/trade/${symbol}`
            : slide.ctaPrimary.href;

    // Use text morphing effect to switch between word pairs
    const { firstWord, secondWord, isVisible } = useTextMorph(
        ['Perpetually', 'Ambient'], // firstWord values
        ['Ambitious', 'Perps'], // secondWord values
        5000,
        isActive,
    );

    return (
        <>
            <div className={styles.heroContent}>
                <div className={styles.heroText}>
                    <h1 id={headingId} className={styles.heroTitle}>
                        <span
                            style={{
                                display: 'inline',
                            }}
                        >
                            <span
                                style={{
                                    transition: 'opacity 400ms ease-in-out',
                                    opacity: isVisible ? 1 : 0,
                                    display: 'inline',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {firstWord}
                            </span>{' '}
                            {slide.type === 'hero' && (
                                <span
                                    className={styles.accent}
                                    style={{
                                        transition: 'opacity 400ms ease-in-out',
                                        opacity: isVisible ? 1 : 0,
                                        display: 'inline',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {secondWord}
                                </span>
                            )}
                        </span>
                    </h1>
                    {slide.subtitle ? (
                        <p className={styles.heroSubtitle}>
                            {t(slide.subtitle)}
                        </p>
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
                            {t(slide.ctaSecondary.labelKey)}
                        </button>
                    ) : null}
                </div>
            </div>
        </>
    );
}
