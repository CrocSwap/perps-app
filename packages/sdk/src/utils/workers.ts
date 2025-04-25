// not extracted to a separate file to make SDK portable across diff bundling tools
export function createJsonParserWorker() {
    const workerScript = `
        self.onmessage = function(e) {
            const message = e.data;
            try {
                const parsed = JSON.parse(message);
                self.postMessage({ success: true, data: parsed });
            } catch (error) {
                self.postMessage({ success: false, error: error.message, originalMessage: message });
            }
        };
    `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
}
