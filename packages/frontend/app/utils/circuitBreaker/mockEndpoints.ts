// ---------------------------------------------------------------------------
// Mock endpoint functions for circuit breaker diagnostics and dev harness.
//
// Logging policy:
//   - 200          → silent
//   - 3xx          → console.warn
//   - 4xx (401/404/429) → console.warn
//   - 5xx          → console.warn
//   - Network/timeout  → console.error
//   - All responses carry a .diagnostics property for on-demand inspection
// ---------------------------------------------------------------------------

import { getCircuitBreaker, type HealthSnapshotIF } from './CircuitBreaker';

// ── Types ──────────────────────────────────────────────────────────────────

// structured metadata attached to every mock response or error
export interface MockDiagnosticsIF {
    readonly mock: string;
    readonly status: number | 'NETWORK_ERROR' | 'TIMEOUT';
    readonly latencyMs: number;
}

// a Response with diagnostics attached
export interface MockResponseIF extends Response {
    diagnostics: MockDiagnosticsIF;
}

// a mock function that produces a fetch-like result
export type mockFnT = (latencyMs?: number) => Promise<MockResponseIF>;

// ── Helpers ────────────────────────────────────────────────────────────────

// prefix for all mock log messages
const LOG_PREFIX = '[CircuitBreaker:mock]';

// prefix for diagnostic log messages
const DIAG_PREFIX = '[CircuitBreaker:diag]';

// promise-based delay
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// HTTP status text lookup for common codes
const STATUS_TEXT: Record<number, string> = {
    200: 'OK',
    301: 'Moved Permanently',
    302: 'Found',
    304: 'Not Modified',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    401: 'Unauthorized',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
};

// builds a mock Response with diagnostics and appropriate logging
function buildMockResponse(
    status: number,
    mockName: string,
    latencyMs: number,
    body?: Record<string, unknown>,
    headers?: Record<string, string>,
): MockResponseIF {
    const statusText = STATUS_TEXT[status] ?? `Status ${status}`;
    const diagnostics: MockDiagnosticsIF = {
        mock: mockName,
        status,
        latencyMs,
    };

    // logging: silent on 2xx, warn on everything else
    if (status >= 300 && status < 400) {
        console.warn(`${LOG_PREFIX} ${status} ${statusText} (${mockName})`);
    } else if (status >= 400 && status < 600) {
        console.warn(`${LOG_PREFIX} ${status} ${statusText} (${mockName})`);
    }

    const responseBody = JSON.stringify(body ?? { status: statusText });
    const responseHeaders = new Headers({
        'Content-Type': 'application/json',
        ...headers,
    });

    const response = new Response(responseBody, {
        status,
        statusText,
        headers: responseHeaders,
    }) as MockResponseIF;

    response.diagnostics = diagnostics;
    return response;
}

// ── Success / slow mocks ───────────────────────────────────────────────────

// 200 OK — silent, no logging
export async function mockSuccess(latencyMs = 10): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(200, 'mockSuccess', latencyMs, { ok: true });
}

// 200 OK but delayed beyond slowCallThresholdMs to trigger 'issues' status
export async function mockSlowSuccess(
    latencyMs = 4000,
): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(200, 'mockSlowSuccess', latencyMs, { ok: true });
}

// ── Redirect mocks ─────────────────────────────────────────────────────────

// generic 3xx redirect — warns on any status in 300-399
export async function mock3xx(
    status = 301,
    latencyMs = 10,
): Promise<MockResponseIF> {
    if (status < 300 || status > 399) {
        throw new RangeError(`mock3xx expects status 300-399, got ${status}`);
    }
    await sleep(latencyMs);
    return buildMockResponse(status, 'mock3xx', latencyMs);
}

// ── Client error mocks ─────────────────────────────────────────────────────

// 401 Unauthorized — warns, does not degrade health
export async function mock401(latencyMs = 10): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(401, 'mock401', latencyMs, {
        error: 'Unauthorized',
    });
}

// 404 Not Found — warns, does not degrade health
export async function mock404(latencyMs = 10): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(404, 'mock404', latencyMs, {
        error: 'Not Found',
    });
}

// 429 Too Many Requests — warns, triggers retry in circuit breaker
export async function mock429(latencyMs = 10): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(
        429,
        'mock429',
        latencyMs,
        {
            error: 'Too Many Requests',
        },
        {
            'Retry-After': '1',
        },
    );
}

// ── Server error mocks ─────────────────────────────────────────────────────

// 500 Internal Server Error — warns, degrades health
export async function mock500(latencyMs = 10): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(500, 'mock500', latencyMs);
}

// 501 Not Implemented — warns, degrades health
export async function mock501(latencyMs = 10): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(501, 'mock501', latencyMs);
}

// 502 Bad Gateway — warns, degrades health
export async function mock502(latencyMs = 10): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(502, 'mock502', latencyMs);
}

// 503 Service Unavailable — warns, degrades health
export async function mock503(latencyMs = 10): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(503, 'mock503', latencyMs);
}

// 504 Gateway Timeout — warns, degrades health
export async function mock504(latencyMs = 10): Promise<MockResponseIF> {
    await sleep(latencyMs);
    return buildMockResponse(504, 'mock504', latencyMs);
}

// generic 5xx for any status code in 500-599
export async function mock5xx(
    status = 500,
    latencyMs = 10,
): Promise<MockResponseIF> {
    if (status < 500 || status > 599) {
        throw new RangeError(`mock5xx expects status 500-599, got ${status}`);
    }
    await sleep(latencyMs);
    return buildMockResponse(status, 'mock5xx', latencyMs);
}

// ── Network failure mocks ──────────────────────────────────────────────────

// simulates a DNS/connection failure — logs error
export async function mockNetworkError(latencyMs = 10): Promise<never> {
    await sleep(latencyMs);
    const err = new TypeError('Failed to fetch');
    (err as TypeError & { diagnostics: MockDiagnosticsIF }).diagnostics = {
        mock: 'mockNetworkError',
        status: 'NETWORK_ERROR',
        latencyMs,
    };
    console.error(
        `${LOG_PREFIX} NETWORK ERROR (mockNetworkError) TypeError: Failed to fetch`,
    );
    throw err;
}

// simulates an unresponsive endpoint — hangs then rejects
export async function mockTimeout(ms = 30_000): Promise<never> {
    await sleep(ms);
    const err = new DOMException('The operation was aborted.', 'AbortError');
    (err as DOMException & { diagnostics: MockDiagnosticsIF }).diagnostics = {
        mock: 'mockTimeout',
        status: 'TIMEOUT',
        latencyMs: ms,
    };
    console.error(
        `${LOG_PREFIX} TIMEOUT (mockTimeout) AbortError: The operation was aborted. (${ms}ms)`,
    );
    throw err;
}

// ── Scenario sequencer ─────────────────────────────────────────────────────

// chains mock functions into a fetch-compatible function that cycles through them in order
export function mockSequence(
    ...steps: Array<mockFnT>
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
    let index = 0;
    return async (
        _input: RequestInfo | URL,
        _init?: RequestInit,
    ): Promise<Response> => {
        if (index >= steps.length) {
            // after exhausting all steps, repeat the last one
            return steps[steps.length - 1]();
        }
        const step = steps[index];
        index++;
        return step();
    };
}

// ── Install / restore helpers ──────────────────────────────────────────────

// replaces globalThis.fetch with a mock function, returns a restore function
export function installMockFetch(
    mockFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
): () => void {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFn as typeof globalThis.fetch;
    return () => {
        globalThis.fetch = originalFetch;
    };
}

// ── Diagnostic runner ──────────────────────────────────────────────────────

// exercises a circuit breaker with a scripted sequence and logs every state transition
export async function runDiagnostic(
    label: string,
    steps: Array<mockFnT>,
): Promise<void> {
    const breaker = getCircuitBreaker(label);
    const total = steps.length;

    console.log(`${DIAG_PREFIX} ── Starting diagnostic for "${label}" ──`);
    console.log(`${DIAG_PREFIX} Initial snapshot:`, breaker.getSnapshot());

    for (let i = 0; i < total; i++) {
        const step = steps[i];
        const stepName = step.name || `step${i}`;
        console.log(`${DIAG_PREFIX} Step ${i + 1}/${total}: ${stepName}`);

        // install mock as globalThis.fetch for this step
        const restore = installMockFetch(async (_input, _init) => step());

        try {
            const response = await breaker.fetch(`https://mock/${stepName}`);
            const snapshot = breaker.getSnapshot();
            logSnapshotLine(snapshot, response.status);
        } catch (err) {
            const snapshot = breaker.getSnapshot();
            logSnapshotError(snapshot, err);
        } finally {
            restore();
        }
    }

    const finalSnapshot = breaker.getSnapshot();
    console.log(`${DIAG_PREFIX} ── Diagnostic complete ──`);
    console.log(`${DIAG_PREFIX} Final snapshot:`, finalSnapshot);
}

// logs a snapshot line after a successful response during diagnostic
function logSnapshotLine(snapshot: HealthSnapshotIF, status: number): void {
    console.log(
        `${DIAG_PREFIX}   → status: ${snapshot.status}` +
            ` | consecutiveFailures: ${snapshot.consecutiveFailures}` +
            ` | latency: ${snapshot.lastLatencyMs}ms` +
            ` | httpStatus: ${status}`,
    );
}

// logs a snapshot line after a rejected response during diagnostic
function logSnapshotError(snapshot: HealthSnapshotIF, err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(
        `${DIAG_PREFIX}   → REJECTED: ${msg}` +
            ` | status: ${snapshot.status}` +
            ` | consecutiveFailures: ${snapshot.consecutiveFailures}`,
    );
}
