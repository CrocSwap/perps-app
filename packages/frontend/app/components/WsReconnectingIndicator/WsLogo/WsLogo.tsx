import styles from './WsLogo.module.css';

export default function WsLogo() {
    return (
        <>
            <div className={styles.wifiSymbol}>
                <div className={styles.wifiCircle + ' ' + styles.first}></div>
                <div className={styles.wifiCircle + ' ' + styles.second}></div>
                <div className={styles.wifiCircle + ' ' + styles.third}></div>
                <div className={styles.wifiCircle + ' ' + styles.fourth}></div>
            </div>
        </>
    );
}
