import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

const PORT = Number.parseInt(process.env.PORT || '3000');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;

const app = express();
app.disable('x-powered-by');

const originalWarn = console.warn;
const ignoredSourceMapPattern = /Sourcemap for /;
console.warn = (message, ...rest) => {
    if (typeof message === 'string' && ignoredSourceMapPattern.test(message)) {
        return;
    }
    originalWarn.call(console, message, ...rest);
};

console.log('Starting SPA development server');
const viteDevServer = await createViteServer({
    root,
    server: { middlewareMode: true },
    appType: 'spa',
});
app.use(viteDevServer.middlewares);
const indexHtmlPath = path.join(root, 'index.html');

app.use(async (req, res, next) => {
    try {
        const isIndexHtmlRequest = req.originalUrl === '/index.html';
        const isAssetRequest =
            req.method !== 'GET' ||
            (req.originalUrl.includes('.') && !isIndexHtmlRequest);
        if (isAssetRequest) {
            return next();
        }

        let html = await readFile(indexHtmlPath, 'utf-8');
        html = await viteDevServer.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
        if (typeof error === 'object' && error instanceof Error) {
            viteDevServer.ssrFixStacktrace(error);
        }
        next(error);
    }
});

app.listen(PORT, () => {
    console.log(`SPA dev server running at http://localhost:${PORT}`);
});
