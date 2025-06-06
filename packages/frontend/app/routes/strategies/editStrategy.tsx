import { useStrategiesStore, type strategyIF, type useStrategiesStoreIF } from '~/stores/StrategiesStore';
import CreateStrategy from './CreateStrategy';

export default function editStrategy() {
    const strategies: useStrategiesStoreIF = useStrategiesStore();

    function editStrategy(s: strategyIF, addr: string): void {
        strategies.update(s, addr);
    }

    return (
        <CreateStrategy
            page='edit'
            submitFn={editStrategy}
        />
    );
}