import { languageOptions } from '../Constants';

export const getDefaultLanguage = () => {
    const supportedLanguages = Object.keys(languageOptions);

    const navLang = navigator.language;
    const isNavLangSupported = supportedLanguages.includes(
        navLang.split('-')[0],
    );
    const defaultLanguage = isNavLangSupported
        ? navLang.split('-')[0]
        : navigator.languages
              .map((lang) => lang.split('-')[0]) // Convert 'en-US' to 'en'
              .find((lang) => supportedLanguages.includes(lang)) || 'en';
    return defaultLanguage;
};
