import { getPollingApiUrl, POLLING_API_INFO_ENDPOINT } from '~/utils/Constants';

export const fetchCandles = async (
    coin: string,
    resolution: string,
    from: number,
    to: number,
) => {
    const interval = resolution;

    const requestBody = {
        type: 'candleSnapshot',
        req: {
            coin,
            interval,
            startTime: from * 1000,
            endTime: to * 1000,
        },
    };

    try {
        const url = getPollingApiUrl(requestBody);
        const response = await fetch(`${url}/info`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const json = await response.json();

        if (!json) {
            return undefined;
        }

        return json;
    } catch (error) {
        console.error(error);
        return undefined;
    }
};

export const fetchUserFillsHistory = async (user: string) => {
    const requestBody = {
        type: 'userFills',
        user: user,
    };

    try {
        const response = await fetch(POLLING_API_INFO_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const json = await response.json();

        if (!json) {
            return undefined;
        }

        return json;
    } catch (error) {
        console.error(error);
        return undefined;
    }
};
