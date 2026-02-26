import {
    type useStrategiesStoreIF,
    useStrategiesStore,
    type strategyIF,
} from '~/stores/AgentsStore';
import CreateAgent from './CreateAgent';

export default function NewAgent() {
    const agents: useStrategiesStoreIF = useStrategiesStore();

    return (
        <CreateAgent page='new' submitFn={(s: strategyIF) => agents.add(s)} />
    );
}
