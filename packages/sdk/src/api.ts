import { API_URLS, DEFAULT_API_ENVIRONMENT, type Environment } from './config';
import { ClientError } from './utils/errors';
import { ServerError } from './utils/errors';

export class API {
    public readonly baseUrl: string;
    public readonly environment: Environment;

    constructor(environment: Environment = DEFAULT_API_ENVIRONMENT) {
        this.baseUrl = API_URLS[environment];
        this.environment = environment;
    }

    public async post(path: string, payload: object = {}) {
        const url = `${this.baseUrl}${path}`;
        const res = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' },
        });
        await this._handleException(res);

        return res.json();
    }

    private async _handleException(res: Response) {
        if (res.ok) return;

        const headers = res.headers;
        const statusCode = res.status;
        let bodyText: string | null = null;
        let bodyJson: any = null;

        try {
            bodyText = await res.text();
            bodyJson = JSON.parse(bodyText);
        } catch (err) {
            console.warn('Failed to parse response body as JSON:', err);
        }

        if (statusCode >= 400 && statusCode < 500) {
            if (bodyJson && typeof bodyJson === 'object') {
                const code = bodyJson.code ?? null;
                const msg = bodyJson.msg ?? bodyText;
                const data = 'data' in bodyJson ? bodyJson.data : null;
                throw new ClientError(statusCode, code, msg, headers, data);
            }
            throw new ClientError(
                statusCode,
                null,
                bodyText ?? '',
                headers,
                null,
            );
        }

        throw new ServerError(statusCode, bodyText ?? '');
    }
}
