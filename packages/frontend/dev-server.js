import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import os from 'node:os';

const loadEnvLocal = async () => {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const envPath = path.join(__dirname, '.env.local');
        const content = await readFile(envPath, 'utf-8');
        for (const rawLine of content.split(/\r?\n/)) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;
            const idx = line.indexOf('=');
            if (idx === -1) continue;
            const key = line.slice(0, idx).trim();
            let value = line.slice(idx + 1).trim();
            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }
            if (key && process.env[key] === undefined) {
                process.env[key] = value;
            }
        }
    } catch {
        // ignore
    }
};

await loadEnvLocal();

const PORT = Number.parseInt(process.env.PORT || '3000');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;

const app = express();
app.disable('x-powered-by');

app.use(express.json({ limit: '1mb' }));

const PLATFORM_TO_HUBSPOT = {
    'X/Twitter': 'x_twitter',
    Youtube: 'youtube',
    Telegram: 'telegram',
    Discord: 'discord',
    Facebook: 'facebook',
    Instagram: 'instagram',
    Tiktok: 'tiktok',
    Twitch: 'twitch',
    Linkedin: 'linkedin',
    'Weibo (微博)': 'weibo',
    'WeChat (微信)': 'wechat',
    'Xiaohongshu (小红书)': 'xiaohongshu',
    'Douyin (抖音)': 'douyin',
    KakaoTalk: 'kakaotalk',
    Line: 'line',
    VK: 'vk',
    Odnoklassniki: 'odnoklassniki',
    Rutube: 'rutube',
    Other: 'others',
};

const IM_TO_HUBSPOT = {
    Telegram: 'im___telegram',
    WhatsApp: 'hs_whatsapp_phone_number',
    WeChat: 'im___wechat',
    QQ: 'im___qq',
    KakaoTalk: 'im___kakaotalk',
    LINE: 'im___line',
};

const LANGUAGE_TO_CODE = {
    Afrikaans: 'af',
    Albanian: 'sq',
    Arabic: 'ar',
    Armenian: 'hy',
    Assamese: 'as',
    Azerbaijani: 'az',
    Basque: 'eu',
    Belarusian: 'be',
    Bengali: 'bn',
    Bosnian: 'ba',
    Bulgarian: 'bg',
    Burmese: 'my',
    Catalan: 'ca',
    'Chinese (Simplified)': 'zh-chs',
    'Chinese (Traditional)': 'zh-cht',
    Croatian: 'hr',
    Czech: 'cs',
    Danish: 'da',
    Dutch: 'nl',
    English: 'en',
    Estonian: 'et',
    Faroese: 'fo',
    Farsi: 'fa',
    Finnish: 'fi',
    French: 'fr',
    Galician: 'gl',
    Georgian: 'ka',
    German: 'de',
    Greek: 'el',
    Gujarati: 'gu',
    'Haitian Creole': 'ht',
    Hausa: 'ha',
    Hebrew: 'he',
    Hindi: 'hi',
    Hungarian: 'hu',
    Icelandic: 'is',
    Indonesian: 'id',
    Irish: 'ga',
    Italian: 'it',
    Japanese: 'ja',
    Kannada: 'kn',
    Kazakh: 'kk',
    Kinyarwanda: 'rw',
    Kiswahili: 'ki',
    Konkani: 'ok',
    Korean: 'ko',
    Kurdish: 'ku',
    Kyrgyz: 'ky',
    Lao: 'lo',
    Latvian: 'lv',
    Lithuanian: 'lt',
    Macedonian: 'mk',
    Malagasy: 'mg',
    Malay: 'ms',
    Malayalam: 'm1',
    Maltese: 'mt',
    Marathi: 'mr',
    Mongolian: 'mn',
    Norwegian: 'no',
    'Norwegian Bokmal': 'nb',
    Nyanja: 'ny',
    Polish: 'pl',
    Portuguese: 'pt',
    Punjabi: 'pa',
    Romanian: 'ro',
    Russian: 'ru',
    Sanskrit: 'sa',
    Serbian: 'sr',
    Slovak: 'sk',
    Slovenian: 'sl',
    Spanish: 'es',
    Swahili: 'sw',
    Swedish: 'sv',
    Syriac: 'sy',
    Tagalog: 't1',
    Tamil: 'ta',
    Tatar: 'tt',
    Telugu: 'te',
    Thai: 'th',
    Turkish: 'tr',
    Ukrainian: 'uk',
    Urdu: 'ur',
    Uzbek: 'uz',
    Vietnamese: 'vi',
    Yoruba: 'yo',
};

app.post('/api/hubspot', async (req, res) => {
    try {
        const hubspotToken = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
        if (!hubspotToken) {
            return res
                .status(500)
                .json({ error: 'HubSpot configuration missing' });
        }

        const body = req.body || {};

        const properties = {
            email: body.email,
            firstname: body.firstName,
            lastname: body.lastName,
            phone: body.phone,
            instant_messenger: body.im,
            social_identity_name: body.socialName,
            wallet_address: body.walletAddress,
            lifecyclestage: 'lead',
            referral_update_request: body.upgradeRequest,
        };

        if (body.recommenderName) {
            properties.recommender_name = body.recommenderName;
        }
        if (body.recommenderEmail) {
            properties.recommender_email = body.recommenderEmail;
        }
        if (body.affiliateAgreement !== undefined) {
            properties.affiliate_agreement = body.affiliateAgreement;
        }

        const imProperty = IM_TO_HUBSPOT[body.im];
        if (imProperty) {
            properties[imProperty] = body.imHandle;
        } else {
            properties.im___others = body.imHandle;
        }

        if (body.im === 'WhatsApp') {
            properties.hs_whatsapp_phone_number = body.phone;
        }

        const socialChannels = Array.isArray(body.socialChannels)
            ? body.socialChannels
            : [];
        for (const channel of socialChannels) {
            const hubspotPrefix = PLATFORM_TO_HUBSPOT[channel.platform];
            if (hubspotPrefix && channel.link) {
                properties[`${hubspotPrefix}_link`] = channel.link;

                if (channel.followers) {
                    const followersNum = parseInt(channel.followers, 10);
                    if (!Number.isNaN(followersNum)) {
                        properties[`${hubspotPrefix}_followers_subscribers`] =
                            followersNum;
                    }
                }

                if (channel.language) {
                    const langCode =
                        LANGUAGE_TO_CODE[channel.language] ||
                        String(channel.language).toLowerCase();
                    properties[`${hubspotPrefix}_language`] = langCode;
                }
            }
        }

        const hubspotUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
        const hubspotResponse = await fetch(hubspotUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${hubspotToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ properties }),
        });

        if (!hubspotResponse.ok) {
            const errorText = await hubspotResponse.text();

            let errorCode = 'UNKNOWN';
            let errorMessage = 'Failed to create contact in HubSpot';

            try {
                const errorData = JSON.parse(errorText);
                errorCode = errorData.category || 'UNKNOWN';

                if (
                    errorCode === 'CONFLICT' &&
                    errorData.message?.includes('Contact already exists')
                ) {
                    errorMessage =
                        'This email is already registered. Please use a different email address.';
                } else if (errorCode === 'VALIDATION_ERROR') {
                    errorMessage =
                        'Invalid data provided. Please check your information and try again.';
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch {
                // ignore
            }

            return res.status(hubspotResponse.status).json({
                error: errorMessage,
                code: errorCode,
                details: errorText,
            });
        }

        const responseData = await hubspotResponse.json();
        return res.status(200).json({
            success: true,
            message: 'Contact created successfully',
            data: responseData,
        });
    } catch (error) {
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

const getLanAddresses = () => {
    const nets = os.networkInterfaces();
    const results = new Set();
    Object.values(nets).forEach((interfaces) => {
        interfaces?.forEach((net) => {
            if (net.family === 'IPv4' && !net.internal) {
                results.add(net.address);
            }
        });
    });
    return [...results];
};

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
    const lanAddresses = getLanAddresses();
    if (lanAddresses.length > 0) {
        lanAddresses.forEach((address) => {
            console.log(
                `LAN dev server available at http://${address}:${PORT}`,
            );
        });
    } else {
        console.log(
            'LAN IP not detected automatically. Run `ipconfig getiflist` to find your interface.',
        );
    }
});
