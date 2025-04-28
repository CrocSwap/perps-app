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
            <div className={styles.fee_schedule_modal}>
                <section className={styles.fee_table}>
                    <header>
                        <div>Tier</div>
                        <div>14D Volume</div>
                        <div>Taker</div>
                        <div>Maker</div>
                    </header>
                    <ol>
                        {
                            makeVolData(8).map(
                                (vol: volHistoryIF) => (
                                    <li key={JSON.stringify(vol)}>
                                        <div>{vol.date}</div>
                                        <div>{vol.exchVol}</div>
                                        <div>{vol.makerVol}</div>
                                        <div>{vol.takerVol}</div>
                                    </li>
                                )
                            )
                        }
                    </ol>
                </section>
                <div className={styles.neg_fees}>Dates are based on UTC time zones and do not include the current day.</div>
                <div className={styles.neg_fees}>Your 14D maker volume share is 0.00%.</div>
            </div>
        </Modal>
    );
}