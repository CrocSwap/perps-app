/// <reference lib="webworker" />

export type JsonParserInput = string;
export type JsonParserOutput = object | { error: string };

self.onmessage = function (event: MessageEvent<JsonParserInput>) {
    try {
        const parsedData = JSON.parse(event.data);
        self.postMessage(parsedData);
    } catch (error) {
        console.error('Error parsing JSON in jsonParser.worker:', error);
        self.postMessage({ error: (error as Error).message });
    }
};
