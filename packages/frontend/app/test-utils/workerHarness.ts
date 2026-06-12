import { vi } from 'vitest';

type WorkerSelf = {
    onmessage?: (event: MessageEvent) => void;
    postMessage: ReturnType<typeof vi.fn>;
};

export async function loadWorkerModule(modulePath: string) {
    vi.resetModules();
    const workerSelf: WorkerSelf = {
        postMessage: vi.fn(),
    };
    vi.stubGlobal('self', workerSelf);
    await import(modulePath);
    if (typeof workerSelf.onmessage !== 'function') {
        throw new Error(`Worker ${modulePath} did not register onmessage`);
    }
    return workerSelf as Required<WorkerSelf>;
}
