import { createRequestListener } from '@mjackson/node-fetch-server';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number.parseInt(process.env.PORT || '3000');

const HOST_PORT = process.env.HOST_PORT || undefined;

const app = express();
app.disable('x-powered-by');

console.log('Starting production server');

// Serve static files from the build/client directory
const clientBuildPath = path.join(__dirname, 'build', 'client');
app.use(express.static(clientBuildPath, { maxAge: '1y' }));

// SSR handler
app.use(async (req, res, next) => {
    try {
        return await createRequestListener(async (request) => {
            // Import the built server module
            const source = await import('./build/server/server.js');
            return await source.default(request, {
                // TODO: Mock any required netlify functions context
            });
        })(req, res);
    } catch (error) {
        console.error('SSR Error:', error);
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
        console.log(
            `Production server is running on http://localhost:{HOST_PORT}`,
        );
    }
});
