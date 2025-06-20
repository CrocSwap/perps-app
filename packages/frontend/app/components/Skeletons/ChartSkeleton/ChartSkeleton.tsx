import styles from './ChartSkeleton.module.css';

interface ChartSkeletonProps {}

const ChartSkeleton: React.FC<ChartSkeletonProps> = ({}) => {
    return (
        <>
            <div className={styles.loadingWrapper}>
                <div className={styles.loading1}></div>
                <div className={styles.loading2}></div>
                <div className={styles.loading3}></div>
                <div className={styles.loading4}></div>
            </div>
        </>
    );
};

export default ChartSkeleton;
