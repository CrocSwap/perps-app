import Modal from '~/components/Modal/Modal';
import styles from './VolHistory.module.css';

interface volHistoryIF {
    date: string;
    exchVol: string;
    makerVol: string;
    takerVol: string;
}

function makeVolData(n: number): volHistoryIF[] {
    function makeNum(min: number, max: number, digits?: number): string {
        if (min > max) {
            [min, max] = [max, min];
        }
        min = Math.ceil(min);
        max = Math.floor(max);
        const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
        if (digits !== undefined) {
            const paddingLength = Math.abs(digits).toString().length;
            return randomInt.toString().padStart(paddingLength, '0');
        }
        return randomInt.toString();
    }
    function makeDatum(): volHistoryIF {
        const output: volHistoryIF = {
            date: '',
            exchVol: '',
            makerVol: '',
            takerVol: '',
        }
        output.date = `${makeNum(2024, 2025)}-${makeNum(1, 12, 2)}-${makeNum(1, 28, 2)}`;
        output.exchVol = `$${makeNum(0, 999)},${makeNum(0, 999, 3)},${makeNum(0, 999, 3)},${makeNum(0, 999, 3)}.${makeNum(0, 99, 2)}`;
        output.makerVol = `$${makeNum(0, 1)}.${makeNum(0, 99, 2)}`;
        output.takerVol = `$${makeNum(0, 1)}.${makeNum(0, 99, 2)}`;
        return output;
    }
    return Array.from({ length: n }, () => makeDatum())
        .sort(
            (a, b) => parseInt(b.date) - parseInt(a.date)
        );
}

interface propsIF {
    close: () => void;
}

export default function VolHistory(props: propsIF) {
    const { close } = props;

    return (
        <Modal
            title='Your Volume History'
            close={close}
        >
            <div className={styles.vol_history_modal}>
                <section className={styles.vol_history_table}>
                    <header>
                        <div className={styles.left}>Date</div>
                        <div className={styles.right}>Exchange Volume</div>
                        <div className={styles.right}>Your Maker Volume</div>
                        <div className={styles.right}>Your Taker Volume</div>
                    </header>
                    <ol>
                        {
                            makeVolData(8).map(
                                (vol: volHistoryIF) => (
                                    <li key={JSON.stringify(vol)}>
                                        <div className={styles.left}>{vol.date}</div>
                                        <div className={styles.right}>{vol.exchVol}</div>
                                        <div className={styles.right}>{vol.makerVol}</div>
                                        <div className={styles.right}>{vol.takerVol}</div>
                                    </li>
                                )
                            )
                        }
                    </ol>
                </section>
                <div className={styles.note}>Dates are based on UTC time zones and do not include the current day.</div>
                <div className={styles.note}>Your 14D maker volume share is 0.00%.</div>
            </div>
        </Modal>
    );
}