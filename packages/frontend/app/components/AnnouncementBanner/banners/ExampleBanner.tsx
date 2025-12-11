import React from 'react';
import styles from './ExampleBanner.module.css';

/**
 * Example custom announcement banner component.
 * Create your own banners following this pattern.
 *
 * To activate this banner, set VITE_ACTIVE_ANNOUNCEMENT_BANNER=example in your .env
 */
const ExampleBanner: React.FC = () => {
    return (
        <div className={styles.exampleBanner}>
            <span className={styles.emoji}>🚀</span>
            <div className={styles.textContent}>
                <strong>New Features Available!</strong>
                <span className={styles.body}>
                    Check out our latest trading improvements.
                </span>
            </div>
            <a
                href='https://docs.ambient.finance'
                target='_blank'
                rel='noopener noreferrer'
                className={styles.ctaButton}
            >
                Learn More
            </a>
        </div>
    );
};

export default ExampleBanner;
