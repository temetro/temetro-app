import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import { I18nManager } from 'react-native';

// The languages the wallet ships. Arabic is right-to-left (full RTL mirroring).
export type LanguageCode = 'en' | 'fr' | 'ar' | 'so';

export type LanguageOption = {
  code: LanguageCode;
  // Endonym — shown in the picker in the language's own script.
  label: string;
  english: string;
  rtl: boolean;
};

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', english: 'English', rtl: false },
  { code: 'fr', label: 'Français', english: 'French', rtl: false },
  { code: 'ar', label: 'العربية', english: 'Arabic', rtl: true },
  { code: 'so', label: 'Soomaali', english: 'Somali', rtl: false },
];

const STORE_KEY = 'temetro.language';

export function isRtlLanguage(code: string): boolean {
  return LANGUAGES.find((l) => l.code === code)?.rtl ?? false;
}

// Synchronously read the persisted language (used at boot, before first render).
export function getStoredLanguage(): LanguageCode | null {
  try {
    const value = SecureStore.getItem(STORE_KEY);
    if (value && LANGUAGES.some((l) => l.code === value)) {
      return value as LanguageCode;
    }
  } catch {
    /* nothing stored / keychain unavailable — fall through */
  }
  return null;
}

// The language to boot with: persisted choice → device language → English.
export function resolveInitialLanguage(): LanguageCode {
  const stored = getStoredLanguage();
  if (stored) return stored;
  const device = getLocales()[0]?.languageCode ?? 'en';
  const match = LANGUAGES.find((l) => l.code === device);
  return match ? match.code : 'en';
}

export function persistLanguage(code: LanguageCode): void {
  try {
    SecureStore.setItem(STORE_KEY, code);
  } catch {
    /* best effort — the in-memory choice still applies this session */
  }
}

// Align the native layout direction with the given language. RN only picks up a
// direction flip after a full reload, so this returns whether the direction
// actually changed — callers use that to decide whether to prompt for a restart.
export function applyDirectionForLanguage(code: string): boolean {
  const rtl = isRtlLanguage(code);
  I18nManager.allowRTL(true);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.forceRTL(rtl);
    return true;
  }
  return false;
}
