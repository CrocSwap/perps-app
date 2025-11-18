import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number.parseInt(process.env.PORT || '3000');

const HOST_PORT = process.env.HOST_PORT || undefined;

const app = express();
app.disable('x-powered-by');

// Enable gzip compression
app.use(compression());

console.log('Starting static production server');

// Serve static files from the build directory
const clientBuildPath = path.join(__dirname, 'build');
app.use(
    express.static(clientBuildPath, {
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
            // Cache hashed assets aggressively
            if (filePath.includes('/assets/')) {
                res.setHeader(
                    'Cache-Control',
                    'public, max-age=31536000, immutable',
                );
            }
            // Don't cache HTML files
            else if (filePath.endsWith('.html')) {
                res.setHeader(
                    'Cache-Control',
                    'no-cache, no-store, must-revalidate',
                );
            }
            // Cache service worker for 24 hours
            else if (filePath.endsWith('sw.js')) {
                res.setHeader('Cache-Control', 'public, max-age=86400');
            }
        },
    }),
);

// SPA fallback - Express 5 requires explicit wildcard syntax
app.use(async (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    try {
        const indexPath = path.join(clientBuildPath, 'index.html');
        const html = await readFile(indexPath, 'utf-8');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
        console.error('SPA fallback error:', error);
        next(error);
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
    if (HOST_PORT) {
        console.log(
            `Production server is running on http://localhost:${HOST_PORT}`,
        );
    } else {
        console.log(`Production server is running on http://localhost:${PORT}`);
    }
});
