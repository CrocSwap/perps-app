// scripts/copy-tradingview.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root paths
const APP_ROOT = path.resolve(__dirname, '../app');
const SUBMODULE_ROOT = path.join(APP_ROOT, 'tv');
const PUBLIC_DIR = path.resolve(__dirname, '../public');

// Define specific paths to copy
const COPY_PATHS = [
    {
        source: path.join(SUBMODULE_ROOT, 'charting_library'),
        dest: path.join(PUBLIC_DIR, 'tv/charting_library'),
    },
    {
        source: path.join(SUBMODULE_ROOT, 'datafeeds/udf/dist/bundle.js'),
        dest: path.join(PUBLIC_DIR, 'tv/datafeeds/udf/dist/bundle.js'),
    },
    {
        source: path.join(APP_ROOT, 'css/tradingview-overrides.css'),
        dest: path.join(PUBLIC_DIR, 'tv/tradingview-overrides.css'),
    },
];

// Perform the copy operations
try {
    console.log('Copying TradingView files to public directory...');

    // Copy each path
    COPY_PATHS.forEach(({ source, dest }) => {
        // Check if source exists
        if (!fs.existsSync(source)) {
            console.error(`Source path does not exist: ${source}`);
            return;
        }

        // Create destination directory if needed
        fs.ensureDirSync(path.dirname(dest));

        // Check if we're copying a directory or file
        const stats = fs.statSync(source);
        if (stats.isDirectory()) {
            console.log(`Copying directory: ${source} -> ${dest}`);
            fs.copySync(source, dest, { overwrite: true });
        } else {
            console.log(`Copying file: ${source} -> ${dest}`);
            fs.copySync(source, dest, { overwrite: true });
        }
    });

    console.log('TradingView files copied successfully!');
} catch (error) {
    console.error('Error copying TradingView files:', error);
    process.exit(1);
}
