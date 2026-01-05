import { type ReactNode } from 'react';
import styles from './LinkCard.module.css';

interface LinkCardProps {
    title: string;
    subtitle: string;
    href: string;
    icon?: ReactNode;
}

export function LinkCard({ title, subtitle, href, icon }: LinkCardProps) {
    return (
        <a href={href} target='_blank' rel='noreferrer' className={styles.card}>
            <span aria-hidden className={styles.backgroundBase} />
            <span aria-hidden className={styles.backgroundHover} />
            <div className={styles.content}>
                {icon ? <div className={styles.iconWrapper}>{icon}</div> : null}
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.subtitle}>{subtitle}</p>
            </div>
        </a>
    );
}
