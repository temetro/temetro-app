import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';

// i18next setup for the wallet app. Only English ships today; other locales can
// be added later by dropping a `locales/<lng>.json` file, importing it here, and
// expanding `resources` + `supportedLngs`. The device language is auto-detected
// and always falls back to English.
const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: deviceLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en'],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
