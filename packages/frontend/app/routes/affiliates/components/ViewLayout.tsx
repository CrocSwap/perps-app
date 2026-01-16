import type { ReactNode } from 'react';
import styles from '../affiliates.module.css';

interface ViewLayoutProps {
    title: string;
    children: ReactNode;
    actions?: ReactNode;
}

export function ViewLayout({ title, children, actions }: ViewLayoutProps) {
    return (
        <>
            <div
                style={{
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <h2
                    className={styles['section-title']}
                    style={{ marginBottom: 0 }}
                >
                    {title}
                </h2>
                {actions && <div>{actions}</div>}
            </div>
            {children}
        </>
    );
}
