import styles from './DocWrapper.module.css';

interface DocWrapperProps {
    children: React.ReactNode;
    title: string;
    lastUpdated?: string;
}

function DocWrapper(props: DocWrapperProps) {
    const { children, title, lastUpdated } = props;

    return (
        <div className={`${styles.container}`}>
            <div className={styles.innerContainer}>
                <div className={styles.titleSection}>
                    <header>{title}</header>
                    {lastUpdated && (
                        <p className={styles.lastUpdated}>
                            Last updated: {lastUpdated}
                        </p>
                    )}
                </div>
                <div className={styles.docContent}>{children}</div>
            </div>
        </div>
    );
}
export default DocWrapper;
