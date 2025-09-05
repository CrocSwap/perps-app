import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en/translation.json';
import esTranslation from '../locales/es/translation.json';
import zhTranslation from '../locales/zh/translation.json';

const resources = {
    en: {
        translation: enTranslation,
    },
    es: {
        translation: esTranslation,
    },
    zh: {
        translation: zhTranslation,
    },
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        // debug: process.env.NODE_ENV === 'development',
        debug: true,

        interpolation: {
            escapeValue: false,
        },
    });

// Add language change listener
i18n.on('languageChanged', (lng) => {
    console.debug('🌐 Language changed to: ', lng);
    console.debug('📍 Resolved language: ', i18n.resolvedLanguage);
    console.debug('🗂️ Available languages: ', Object.keys(resources));
});

// Log initial language detection
i18n.on('initialized', () => {
    console.debug('✅ i18n initialized with language: ', i18n.language);
    console.debug('🔍 Browser languages: ', navigator.languages);
});

// Log when translations are loaded
i18n.on('loaded', (loaded) => {
    console.debug('📚 Translations loaded: ', loaded);
});

// Log loading failures
i18n.on('failedLoading', (lng, ns, msg) => {
    console.error('❌ Failed loading: ', lng, ns, msg);
});

export default i18n;
