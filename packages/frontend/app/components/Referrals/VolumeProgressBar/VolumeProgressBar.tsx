import styles from './VolumeProgressBar.module.css';

interface PropsIF {
    volume: number;
    volumeFormatted: string;
    barWidth: number;
}

export default function VolumeProgressBar(props: PropsIF) {
    const { volume, volumeFormatted, barWidth } = props;

    return (
        <div className={styles.volume_progress_bar}>
            <div className={styles.volume_progress_bar_labels}>
                <p>Your volume:</p>
                <p>{volumeFormatted}</p>
            </div>
            {!volume && (
                <div className={styles.volume_progress_bar_body}>
                    {!!volume && (
                        <div
                            style={{
                                width: `${Math.min(
                                    100,
                                    (volume / barWidth) * 100,
                                )}%`,
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
