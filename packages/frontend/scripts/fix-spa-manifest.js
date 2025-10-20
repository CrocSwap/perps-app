const fs = require('fs');
const path = require('path');

async function fixSpaManifest() {
    try {
        console.log('🔧 Fixing SPA manifest for React Router...');

        // Check if build directory exists
        const buildDir = path.join(process.cwd(), 'build');
        if (!fs.existsSync(buildDir)) {
            console.log('❌ Build directory not found');
            return;
        }

        // Check for server build files
        const serverDir = path.join(buildDir, 'server');
        const clientDir = path.join(buildDir, 'client');

        // If this is an SPA build, ensure server files are cleaned up properly
        if (fs.existsSync(serverDir)) {
            console.log('🧹 Cleaning up server build files for SPA mode...');

            // Remove server directory as it's not needed for SPA
            await fs.promises.rm(serverDir, { recursive: true, force: true });
            console.log('✅ Server build files removed');
        }

        // Check if there's a manifest file that might need updating
        const clientAssetsDir = path.join(clientDir, 'assets');
        if (fs.existsSync(clientAssetsDir)) {
            const files = await fs.promises.readdir(clientAssetsDir);
            const manifestFiles = files.filter((f) => f.endsWith('.json'));

            for (const manifestFile of manifestFiles) {
                const manifestPath = path.join(clientAssetsDir, manifestFile);
                try {
                    const manifest = JSON.parse(
                        await fs.promises.readFile(manifestPath, 'utf8'),
                    );

                    // Remove any server build references from manifest
                    if (manifest && typeof manifest === 'object') {
                        // Remove server-related entries
                        Object.keys(manifest).forEach((key) => {
                            if (
                                key.includes('server') ||
                                key.includes('virtual_netlify-server')
                            ) {
                                delete manifest[key];
                            }
                        });

                        await fs.promises.writeFile(
                            manifestPath,
                            JSON.stringify(manifest, null, 2),
                        );
                        console.log(`✅ Updated manifest: ${manifestFile}`);
                    }
                } catch (error) {
                    console.warn(
                        `⚠️  Could not process manifest ${manifestFile}:`,
                        error.message,
                    );
                }
            }
        }

        console.log('🎉 SPA manifest fix completed successfully');
    } catch (error) {
        console.error('❌ Error fixing SPA manifest:', error);
        process.exit(1);
    }
}

fixSpaManifest();
