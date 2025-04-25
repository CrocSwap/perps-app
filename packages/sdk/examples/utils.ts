import { Info } from '../src/info';
import { Exchange } from '../src/exchange';
import { DEMO_USER, type Environment } from '../src/config';

export async function setup(environment: Environment, skipWs: boolean = false) {
    const info = new Info({ environment, skipWs, isDebug: true });
    const exchange = new Exchange(
        {},
        { environment, accountAddress: DEMO_USER, isDebug: true },
    );
    return { address: DEMO_USER, info, exchange };
}
