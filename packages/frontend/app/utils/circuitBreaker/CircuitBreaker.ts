// ---------------------------------------------------------------------------
// CircuitBreaker – generic fetch wrapper with health tracking, throttling,
// retry-with-backoff, and an observable state machine.
//
// States:  up  →  issues  →  down  →  (half-open probe)  →  up
// ---------------------------------------------------------------------------

// ── Types ──────────────────────────────────────────────────────────────────

// human-readable status labels
export type circuitStatusT = 'up' | 'issues' | 'down';

// configuration options passed when creating a circuit breaker instance
export interface CircuitBreakerConfigIF {
    // Human-readable label for this breaker (e.g. "fuul")
    readonly label: string;
    // Calls slower than this (ms) move status to 'issues'. Default 3000
    readonly slowCallThresholdMs?: number;
    // Max concurrent in-flight requests. Default 6
    readonly maxConcurrent?: number;
    // Max retry attempts for 429 / 5xx responses. Default 2
    readonly maxRetries?: number;
    // Base delay (ms) for exponential backoff. Default 1000
    readonly baseRetryDelayMs?: number;
    // Consecutive failures before status becomes 'down'. Default 3
    readonly failuresToMarkDown?: number;
    // Time (ms) to stay in 'down' before allowing a half-open probe. Default 30000
    readonly cooldownMs?: number;
}

// point-in-time health state exposed to consumers and listeners
export interface HealthSnapshotIF {
    readonly status: circuitStatusT;
    readonly lastUpdatedAt: number;
    readonly lastSuccessAt: number | null;
    readonly lastFailureAt: number | null;
    readonly consecutiveFailures: number;
    readonly lastLatencyMs: number | null;
    readonly lastErrorMessage: string | null;
    readonly lastWarningMessage: string | null;
}

// callback signature for health-change subscribers
type healthListenerT = (snapshot: HealthSnapshotIF) => void;

// ── Defaults ───────────────────────────────────────────────────────────────

// fallback values used when config omits optional fields
const DEFAULTS = {
    slowCallThresholdMs: 3000,
    maxConcurrent: 6,
    maxRetries: 2,
    baseRetryDelayMs: 1000,
    failuresToMarkDown: 3,
    cooldownMs: 30_000,
} as const satisfies Required<Omit<CircuitBreakerConfigIF, 'label'>>;

// ── Helpers ────────────────────────────────────────────────────────────────

// returns true for HTTP 429 and 5xx status codes
function isRetryableStatus(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600);
}

// coerces an unknown thrown value into a human-readable string
function extractErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try {
        return JSON.stringify(err);
    } catch {
        return String(err);
    }
}

// ── ThrottleQueue ──────────────────────────────────────────────────────────

// public shape of the concurrency-limiting queue
interface ThrottleQueueIF {
    enqueue<T>(fn: () => Promise<T>): Promise<T>;
}

// limits how many promises run concurrently (FIFO overflow queue)
class ThrottleQueue implements ThrottleQueueIF {
    private queue: Array<() => void> = [];
    private active = 0;

    constructor(private maxConcurrent: number) {}

    enqueue<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const execute = () => {
                this.active++;
                fn()
                    .then(resolve)
                    .catch(reject)
                    .finally(() => {
                        this.active--;
                        this.flush();
                    });
            };

            if (this.active < this.maxConcurrent) {
                execute();
            } else {
                this.queue.push(execute);
            }
        });
    }

    private flush(): void {
        while (this.active < this.maxConcurrent && this.queue.length > 0) {
            const next = this.queue.shift()!;
            next();
        }
    }
}

// ── CircuitBreaker ─────────────────────────────────────────────────────────

// public shape of the circuit breaker consumed by hooks and utilities
export interface CircuitBreakerIF {
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    getSnapshot(): HealthSnapshotIF;
    subscribe(listener: healthListenerT): () => void;
    ping(url: string, init?: RequestInit): Promise<void>;
}

// core engine: wraps fetch with throttling, retry, and health tracking
export class CircuitBreaker implements CircuitBreakerIF {
    private readonly label: string;
    private readonly slowCallThresholdMs: number;
    private readonly maxRetries: number;
    private readonly baseRetryDelayMs: number;
    private readonly failuresToMarkDown: number;
    private readonly cooldownMs: number;
    private readonly throttle: ThrottleQueue;
    private readonly listeners = new Set<healthListenerT>();

    private snapshot: HealthSnapshotIF = {
        status: 'up',
        lastUpdatedAt: Date.now(),
        lastSuccessAt: null,
        lastFailureAt: null,
        consecutiveFailures: 0,
        lastLatencyMs: null,
        lastErrorMessage: null,
        lastWarningMessage: null,
    };

    // Tracks whether a half-open probe is already in flight so we only
    // allow one request through at a time while the breaker is down.
    private halfOpenInFlight = false;

    constructor(config: CircuitBreakerConfigIF) {
        this.label = config.label;
        this.slowCallThresholdMs =
            config.slowCallThresholdMs ?? DEFAULTS.slowCallThresholdMs;
        this.maxRetries = config.maxRetries ?? DEFAULTS.maxRetries;
        this.baseRetryDelayMs =
            config.baseRetryDelayMs ?? DEFAULTS.baseRetryDelayMs;
        this.failuresToMarkDown =
            config.failuresToMarkDown ?? DEFAULTS.failuresToMarkDown;
        this.cooldownMs = config.cooldownMs ?? DEFAULTS.cooldownMs;
        this.throttle = new ThrottleQueue(
            config.maxConcurrent ?? DEFAULTS.maxConcurrent,
        );
    }

    // ── Public API ─────────────────────────────────────────────────────

    // Route a fetch call through the circuit breaker.
    // Applies concurrency limiting, retry-with-backoff, and health tracking.
    fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        // Down-guard: reject fast if circuit is open and cooldown hasn't elapsed
        if (this.snapshot.status === 'down') {
            const elapsed = Date.now() - (this.snapshot.lastFailureAt ?? 0);
            if (elapsed < this.cooldownMs) {
                return Promise.reject(
                    new CircuitBreakerOpenError(
                        this.label,
                        this.cooldownMs - elapsed,
                    ),
                );
            }
            // Cooldown elapsed → allow exactly one probe (half-open)
            if (this.halfOpenInFlight) {
                return Promise.reject(
                    new CircuitBreakerOpenError(this.label, 0),
                );
            }
        }

        return this.throttle.enqueue(() => this.executeWithRetry(input, init));
    }

    // Current health snapshot (readonly reference, safe due to HealthSnapshotIF readonly props).
    getSnapshot(): HealthSnapshotIF {
        return this.snapshot;
    }

    // Subscribe to health changes. Returns an unsubscribe function.
    subscribe(listener: healthListenerT): () => void {
        this.listeners.add(listener);
        // Deliver current state immediately
        listener(this.getSnapshot());
        return () => {
            this.listeners.delete(listener);
        };
    }

    // Manual health probe: fire a lightweight request and update health.
    // Useful for "check now" buttons in a UI.
    async ping(url: string, init?: RequestInit): Promise<void> {
        const start = Date.now();
        try {
            const res = await globalThis.fetch(url, init);
            if (res.status >= 300 && res.status < 400) {
                console.warn(
                    `[CircuitBreaker:${this.label}] Unexpected redirect: HTTP ${res.status}`,
                );
            }
            if (res.status >= 500) {
                this.markFailure(Date.now() - start, `HTTP ${res.status}`);
            } else {
                this.markSuccess(Date.now() - start);
            }
        } catch (err) {
            this.markFailure(Date.now() - start, extractErrorMessage(err));
        }
    }

    // ── Internals ──────────────────────────────────────────────────────

    private async executeWithRetry(
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<Response> {
        const isProbe = this.snapshot.status === 'down';
        if (isProbe) this.halfOpenInFlight = true;

        try {
            for (let attempt = 0; ; attempt++) {
                const start = Date.now();
                try {
                    const response = await globalThis.fetch(input, init);
                    const latency = Date.now() - start;

                    // Retryable server error → backoff and retry
                    if (
                        isRetryableStatus(response.status) &&
                        attempt < this.maxRetries
                    ) {
                        const delay =
                            this.baseRetryDelayMs * Math.pow(2, attempt);
                        await sleep(delay);
                        continue;
                    }

                    // 3xx redirect → warn but don't degrade health
                    if (response.status >= 300 && response.status < 400) {
                        console.warn(
                            `[CircuitBreaker:${this.label}] Unexpected redirect: HTTP ${response.status}`,
                        );
                    }

                    // 5xx after exhausting retries → mark as health failure
                    if (response.status >= 500) {
                        this.markFailure(latency, `HTTP ${response.status}`);
                        return response;
                    }

                    // 4xx is a client error, not an endpoint health issue
                    if (!response.ok) {
                        return response;
                    }

                    // Success path
                    this.markSuccess(latency);
                    return response;
                } catch (err) {
                    const latency = Date.now() - start;
                    // Network error (not an HTTP status) → retry if attempts remain
                    if (attempt < this.maxRetries) {
                        const delay =
                            this.baseRetryDelayMs * Math.pow(2, attempt);
                        await sleep(delay);
                        continue;
                    }
                    this.markFailure(latency, extractErrorMessage(err));
                    throw err;
                }
            }
        } finally {
            if (isProbe) this.halfOpenInFlight = false;
        }
    }

    private markSuccess(latencyMs: number): void {
        const now = Date.now();
        const isSlow = latencyMs >= this.slowCallThresholdMs;

        this.setSnapshot({
            status: isSlow ? 'issues' : 'up',
            lastUpdatedAt: now,
            lastSuccessAt: now,
            lastFailureAt: this.snapshot.lastFailureAt,
            consecutiveFailures: 0,
            lastLatencyMs: latencyMs,
            lastErrorMessage: null,
            lastWarningMessage: isSlow
                ? `Slow response from [${this.label}] (${latencyMs}ms)`
                : null,
        });
    }

    private markFailure(latencyMs: number, reason: string): void {
        const now = Date.now();
        const failures = this.snapshot.consecutiveFailures + 1;

        this.setSnapshot({
            status: failures >= this.failuresToMarkDown ? 'down' : 'issues',
            lastUpdatedAt: now,
            lastSuccessAt: this.snapshot.lastSuccessAt,
            lastFailureAt: now,
            consecutiveFailures: failures,
            lastLatencyMs: latencyMs,
            lastErrorMessage: reason,
            lastWarningMessage: null,
        });
    }

    private setSnapshot(next: HealthSnapshotIF): void {
        this.snapshot = next;
        for (const listener of this.listeners) {
            listener(this.getSnapshot());
        }
    }
}

// ── CircuitBreakerOpenError ────────────────────────────────────────────────

// public shape of the error thrown when the breaker is open
export interface CircuitBreakerOpenErrorIF {
    readonly remainingCooldownMs: number;
    readonly name: string;
    readonly message: string;
}

// thrown (or used to reject) when a call is attempted while the breaker is open
export class CircuitBreakerOpenError
    extends Error
    implements CircuitBreakerOpenErrorIF
{
    override readonly name = 'CircuitBreakerOpenError';
    readonly remainingCooldownMs: number;

    constructor(label: string, remainingMs: number) {
        super(
            `Circuit breaker [${label}] is open. ` +
                (remainingMs > 0
                    ? `Retry after ${Math.ceil(remainingMs / 1000)}s.`
                    : `Half-open probe already in flight.`),
        );
        this.remainingCooldownMs = remainingMs;
    }
}

// ── Registry (singleton map) ───────────────────────────────────────────────

// singleton map of label → CircuitBreaker instance
const registry = new Map<string, CircuitBreaker>();

// returns the existing breaker for `label`, or creates one with `config` on first call
export function getCircuitBreaker(
    label: string,
    config?: Omit<CircuitBreakerConfigIF, 'label'>,
): CircuitBreaker {
    let breaker = registry.get(label);
    if (!breaker) {
        breaker = new CircuitBreaker({ label, ...config });
        registry.set(label, breaker);
    }
    return breaker;
}

// Remove a breaker from the registry (useful for tests).
export function removeCircuitBreaker(label: string): boolean {
    return registry.delete(label);
}

// ── Utility ────────────────────────────────────────────────────────────────

// promise-based delay used for exponential backoff between retries
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
