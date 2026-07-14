import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { applyDirectionForLanguage, resolveInitialLanguage } from './language';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import so from './locales/so.json';

// i18next setup for the wallet app. Ships English, French, Arabic (RTL) and
// Somali. The active language is the patient's persisted choice (Settings →
// Language), falling back to the device language and then English. Resolved
// synchronously here so the first render is already in the right language, and
// the native layout direction is aligned before the UI mounts.
const initialLanguage = resolveInitialLanguage();
applyDirectionForLanguage(initialLanguage);

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
    so: { translation: so },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  supportedLngs: ['en', 'fr', 'ar', 'so'],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
