import { LinkCard } from '../../LinkCard/LinkCard';
import styles from '../Copy.module.css';
import { OVERLAY_LINKS } from '../../config/overlay-links';

export function LinksSlide() {
    return (
        <div className={`${styles.overlayContent} ${styles.linksOnly}`}>
            <div className={styles.linksGrid}>
                {OVERLAY_LINKS.map((link) => (
                    <LinkCard
                        key={link.href}
                        title={link.title}
                        subtitle={link.subtitle}
                        href={link.href}
                        icon={
                            <img
                                src={link.iconSrc}
                                alt={link.iconAlt ?? ''}
                                role='presentation'
                            />
                        }
                    />
                ))}
            </div>
        </div>
    );
}
