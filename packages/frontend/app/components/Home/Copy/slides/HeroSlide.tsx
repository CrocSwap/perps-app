import { Ticker } from '../../Ticker/Ticker';
import styles from '../Copy.module.css';
import type { PresetId } from '../../types';
import type { HeroSlideConfig } from '../../config/overlay-config';

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
    const handleSecondaryCtaClick = () => {
        if (slide.ctaSecondary.action === 'scrollTo') {
            onScrollToPreset(slide.ctaSecondary.target);
        }
    };

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
                    <a
                        href={slide.ctaPrimary.href}
                        className={styles.ctaPrimary}
                    >
                        {slide.ctaPrimary.label}
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
            {slide.footer === 'ticker' ? (
                <div className={styles.overlayFooter}>
                    <Ticker />
                </div>
            ) : null}
        </>
    );
}
