// ---------------------------------------------------------------------------
// fuulFetch – thin wrapper that routes all Fuul API calls through the
// "fuul" circuit breaker instance.
//
// Drop-in replacement for `fetch` when the target is api.fuul.xyz.
// ---------------------------------------------------------------------------

import { getCircuitBreaker } from './CircuitBreaker';

// base URL for all Fuul API requests
const FUUL_API_BASE_URL = 'https://api.fuul.xyz';

// circuit breaker instance registered under the "fuul" label
const fuulBreaker = getCircuitBreaker('fuul');

// routes a fetch call to api.fuul.xyz through the circuit breaker
export function fuulFetch(path: string, init?: RequestInit): Promise<Response> {
    const url = path.startsWith('http') ? path : `${FUUL_API_BASE_URL}${path}`;
    return fuulBreaker.fetch(url, init);
}
