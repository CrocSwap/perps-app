import { useStrategiesStore, type strategyDecoratedIF } from '~/stores/StrategiesStore';
import styles from './strategies.module.css';
import { useNavigate } from 'react-router';

export default function Strategies() {
    const navigate = useNavigate();

    const { data } = useStrategiesStore();

    return (
        <div className={styles.strategies_page}>
            <h2>Strategies</h2>
            {
                data.map((s: strategyDecoratedIF) => (
                    <button onClick={() => navigate('/strategies/' + s.address)}>
                        View {s.address}
                    </button>
                ))
            }
        </div>
    );
}
