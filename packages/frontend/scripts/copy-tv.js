// scripts/copy-tradingview.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root paths
const APP_ROOT = path.resolve(__dirname, '../app');
const SUBMODULE_ROOT = path.join(APP_ROOT, 'tv');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const CACHE_FILE = path.join(__dirname, '.tv-copy-cache.json');

// Function to calculate file/directory hash
function calculateHash(filePath) {
    const hash = crypto.createHash('md5');

    if (fs.statSync(filePath).isDirectory()) {
        // For directories, hash based on file names and sizes
        const files = [];
        const walkDir = (dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    walkDir(fullPath);
                } else {
                    files.push(
                        `${fullPath}:${stat.mtime.getTime()}:${stat.size}`,
                    );
                }
            }
        };
        walkDir(filePath);
        files.sort(); // Ensure consistent ordering
        hash.update(files.join('|'));
    } else {
        // For files, hash based on content
        const content = fs.readFileSync(filePath);
        hash.update(content);
    }

    return hash.digest('hex');
}

// Function to load previous cache
function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
        } catch (e) {
            return {};
        }
    }
    return {};
}

// Function to save cache
function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 4) + '\n');
}

// Function to check if copy is needed
function needsCopy(source, dest, cache) {
    if (!fs.existsSync(dest)) {
        return true;
    }

    const sourceKey = path.relative(__dirname, source);
    const currentHash = calculateHash(source);

    if (cache[sourceKey] === currentHash) {
        console.log(`No changes detected for: ${sourceKey}`);
        return false;
    }

    return true;
}

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
    console.log('Checking TradingView files for changes...');

    // Load cache
    const cache = loadCache();
    const newCache = {};
    let copiedFiles = 0;

    // Copy each path
    COPY_PATHS.forEach(({ source, dest }) => {
        // Check if source exists
        if (!fs.existsSync(source)) {
            console.error(`Source path does not exist: ${source}`);
            return;
        }

        // Check if we need to copy
        if (!needsCopy(source, dest, cache)) {
            // Update cache with current hash even if no copy needed
            const sourceKey = path.relative(__dirname, source);
            newCache[sourceKey] = calculateHash(source);
            return;
        }

        console.log(`Copying: ${path.relative(__dirname, source)}`);

        // Create destination directory if needed
        fs.ensureDirSync(path.dirname(dest));

        // Check if we're copying a directory or file
        const stats = fs.statSync(source);
        if (stats.isDirectory()) {
            fs.copySync(source, dest, { overwrite: true });
        } else {
            fs.copySync(source, dest, { overwrite: true });
        }

        copiedFiles++;

        // Update cache
        const sourceKey = path.relative(__dirname, source);
        newCache[sourceKey] = calculateHash(source);
    });

    // Save new cache
    saveCache(newCache);

    if (copiedFiles > 0) {
        console.log(
            `TradingView files copied successfully! (${copiedFiles} items updated)`,
        );
    } else {
        console.log('No TradingView files needed updating.');
    }
} catch (error) {
    console.error('Error copying TradingView files:', error);
    process.exit(1);
}
