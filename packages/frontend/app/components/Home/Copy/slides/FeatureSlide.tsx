import { RotatingList } from '../../RotatingList/RotatingList';
import styles from '../Copy.module.css';
import type { FeatureSlideConfig } from '../../config/overlay-config';

interface FeatureSlideProps {
    slide: FeatureSlideConfig;
    headingId: string;
}

export function FeatureSlide({ slide, headingId }: FeatureSlideProps) {
    return (
        <div className={styles.overlayContent}>
            {/* <div className={styles.featureTestBox}>
				<span>Slide 2 test box</span>
			</div> */}
            <div className={styles.featureContentGroup}>
                <div className={styles.overlayText}>
                    <h2 id={headingId} className={styles.sectionTitle}>
                        {slide.title}
                        {slide.accent ? (
                            <>
                                {' '}
                                <span className={styles.accent}>
                                    {slide.accent}
                                </span>
                            </>
                        ) : null}
                    </h2>
                    {slide.subtitle ? (
                        <p className={styles.sectionDescription}>
                            {slide.subtitle}
                        </p>
                    ) : null}
                </div>
                <RotatingList items={slide.listItems} />
            </div>
        </div>
    );
}
