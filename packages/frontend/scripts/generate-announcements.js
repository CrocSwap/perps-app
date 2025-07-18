// scripts/write-version.js
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to package.json
const announcementsJsonPath = path.join(__dirname, '../app/announcements.json');

// Read and parse package.json
const announcementsJson = JSON.parse(
    fs.readFileSync(announcementsJsonPath, 'utf8'),
);

// Use the version property from frontend/package.json
const rawAnnouncements = announcementsJson.announcements;

// Function to hash headline + body
function generateId(headline, body) {
    const hash = crypto.createHash('sha256');
    hash.update(headline + body);
    // Truncate to 8 characters for brevity
    return hash.digest('hex').substring(0, 8);
}

// Process the news array
const outputJson = {
    news: rawAnnouncements.map((item) => ({
        ...item,
        id: generateId(item.headline, item.body),
    })),
};

// Write to the public directory so it gets copied to the build output
const outDir = path.join(__dirname, '../public');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(
    path.join(outDir, 'announcements.json'),
    JSON.stringify(outputJson, null, 2),
);
