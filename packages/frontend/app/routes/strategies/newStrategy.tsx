import {
    type useStrategiesStoreIF,
    useStrategiesStore,
    type strategyIF,
} from '~/stores/StrategiesStore';
import CreateStrategy from './CreateStrategy';

export default function NewAgent() {
    const agents: useStrategiesStoreIF = useStrategiesStore();

    return (
        <CreateStrategy
            page='new'
            submitFn={(s: strategyIF) => agents.add(s)}
        />
    );
}
