import { type useStrategiesStoreIF, useStrategiesStore, type strategyIF } from '~/stores/StrategiesStore';
import CreateStrategy from './CreateStrategy';

export default function newStrategy() {
    const strategies: useStrategiesStoreIF = useStrategiesStore();

    return (
        <CreateStrategy
            page='new'
            submitFn={(s: strategyIF) => strategies.add(s)}
        />
    );
}
