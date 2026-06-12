import { vi } from 'vitest';

export function makeJsonResponse(
    body: unknown,
    options: { ok?: boolean; status?: number } = {},
) {
    return {
        ok: options.ok ?? true,
        status: options.status ?? 200,
        json: vi.fn().mockResolvedValue(body),
    };
}

export function stubFetchJson(
    body: unknown,
    options: { ok?: boolean; status?: number } = {},
) {
    const response = makeJsonResponse(body, options);
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal('fetch', fetchMock);
    return { fetchMock, response };
}

export function stubFetchJsonSequence(
    responses: Array<{
        body: unknown;
        ok?: boolean;
        status?: number;
    }>,
) {
    const fetchMock = vi.fn();
    responses.forEach(({ body, ok, status }) => {
        fetchMock.mockResolvedValueOnce(makeJsonResponse(body, { ok, status }));
    });
    vi.stubGlobal('fetch', fetchMock);
    return { fetchMock };
}
