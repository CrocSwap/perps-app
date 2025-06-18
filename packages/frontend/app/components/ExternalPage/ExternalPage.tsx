import styles from './ExternalPage.module.css';

interface ExternalPageProps {
    children: React.ReactNode;
    title: string;
}

function ExternalPage(props: ExternalPageProps) {
    const { children, title } = props;

    return (
        <div className={`${styles.container} ${styles.fullScreen} `}>
            <header>{title}</header>
            <div className={styles.content}>{children}</div>
        </div>
    );
}
export default ExternalPage;
