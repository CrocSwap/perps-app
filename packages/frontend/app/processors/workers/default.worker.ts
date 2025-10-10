self.onmessage = function (event) {
    try {
        const parsedData = JSON.parse(event.data);
        self.postMessage(parsedData);
    } catch (error) {
        self.postMessage({ error: (error as Error).message });
    }
};
