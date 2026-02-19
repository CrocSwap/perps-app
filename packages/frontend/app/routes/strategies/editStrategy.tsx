import {
    useStrategiesStore,
    type strategyIF,
    type useStrategiesStoreIF,
} from '~/stores/StrategiesStore';
import CreateStrategy from './CreateStrategy';

export default function EditAgent() {
    const agents: useStrategiesStoreIF = useStrategiesStore();

    function editAgent(s: strategyIF, addr: string): void {
        agents.update(s, addr);
    }

    return <CreateStrategy page='edit' submitFn={editAgent} />;
}
