import {
    useStrategiesStore,
    type strategyIF,
    type useStrategiesStoreIF,
} from '~/stores/AgentsStore';
import CreateAgent from './CreateAgent';

export default function EditAgent() {
    const agents: useStrategiesStoreIF = useStrategiesStore();

    function editAgent(s: strategyIF, addr: string): void {
        agents.update(s, addr);
    }

    return <CreateAgent page='edit' submitFn={editAgent} />;
}
