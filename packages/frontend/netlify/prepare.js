import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

// Clean Netlify functions directory (no longer needed for SPA)
await fsp
    .rm('.netlify/functions-internal', { recursive: true, force: true })
    .catch(() => {});

// Check if this is an SSR build or SPA build
const buildDir = path.join(process.cwd(), 'build');
const hasServerDir = await fsp
    .access(path.join(buildDir, 'server'))
    .then(() => true)
    .catch(() => false);
const hasClientDir = await fsp
    .access(path.join(buildDir, 'client'))
    .then(() => true)
    .catch(() => false);

if (hasClientDir && !hasServerDir) {
    // SPA mode - copy client files to root
    console.log('📦 Preparing SPA build...');
    await fsp.mkdir('build/client', { recursive: true });

    // Copy client build artifacts to Netlify publish directory
    await fsp.cp('build/client', 'build', {
        recursive: true,
        filter: (src) => !src.includes('server'), // Exclude any residual server files
    });
} else if (hasServerDir) {
    // SSR mode - keep server files for edge functions
    console.log('📦 Preparing SSR build...');
    // For SSR builds, we keep the server directory for Netlify Functions
    // but still need to ensure client files are properly structured
}

// Create _redirects file for SPA routing (works for both modes)
const redirectsContent = '/* /index.html 200';
await fsp.writeFile(path.join('build', '_redirects'), redirectsContent);

console.log('✅ Build preparation completed');
