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
        slide.ctaPrimary.labelKey === 'home.startTrading'
            ? `/v2/trade/${symbol}`
            : slide.ctaPrimary.href;

    // Use text morphing effect to switch between 'Ambitious' and 'Perps'
    const { secondWord, isVisible } = useTextMorph(
        ['Ambitious', 'Perps'],
        5000,
        isActive,
    );

    // Only apply morphing to the hero slide
    const displayText =
        slide.type === 'hero' ? (
            <span
                className={styles.accent}
                style={{ display: 'inline-block', minWidth: '100px' }}
            >
                <span
                    style={{
                        transition: 'opacity 800ms ease-in-out',
                        opacity:
                            secondWord === 'Ambitious'
                                ? isVisible
                                    ? 1
                                    : 0
                                : isVisible
                                  ? 0
                                  : 1,
                        display: secondWord === 'Ambitious' ? 'inline' : 'none',
                    }}
                >
                    Ambitious
                </span>
                <span
                    style={{
                        transition: 'opacity 800ms ease-in-out',
                        opacity:
                            secondWord === 'Perps'
                                ? isVisible
                                    ? 1
                                    : 0
                                : isVisible
                                  ? 0
                                  : 1,
                        display: secondWord === 'Perps' ? 'inline' : 'none',
                    }}
                >
                    Perps
                </span>
            </span>
        ) : (
            slide.accent
        );

    return (
        <>
            <div className={styles.heroContent}>
                <div className={styles.heroText}>
                    <h1 id={headingId} className={styles.heroTitle}>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25em',
                            }}
                        >
                            <span
                                style={{
                                    transition: 'opacity 800ms ease-in-out',
                                    opacity:
                                        secondWord === 'Ambitious'
                                            ? isVisible
                                                ? 1
                                                : 0
                                            : isVisible
                                              ? 0
                                              : 1,
                                    display:
                                        secondWord === 'Ambitious'
                                            ? 'inline'
                                            : 'none',
                                }}
                            >
                                Perpetually
                            </span>
                            <span
                                style={{
                                    transition: 'opacity 800ms ease-in-out',
                                    opacity:
                                        secondWord === 'Perps'
                                            ? isVisible
                                                ? 1
                                                : 0
                                            : isVisible
                                              ? 0
                                              : 1,
                                    display:
                                        secondWord === 'Perps'
                                            ? 'inline'
                                            : 'none',
                                }}
                            >
                                Ambient
                            </span>
                        </div>
                        {displayText ? <> {displayText}</> : null}
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
