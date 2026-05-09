import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import * as SecureStore from 'expo-secure-store';
import en from './en';
import es from './es';

export const i18n = new I18n({ en, es });

i18n.enableFallback = true;
i18n.defaultLocale  = 'es';

// Detectar idioma del dispositivo; permite override manual guardado en SecureStore
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'es';
i18n.locale = ['es', 'en'].includes(deviceLocale) ? deviceLocale : 'es';

export type Locale = 'es' | 'en';

export const LANG_KEY = 'app_language';

export async function loadSavedLocale() {
  try {
    const saved = await SecureStore.getItemAsync(LANG_KEY) as Locale | null;
    if (saved && ['es', 'en'].includes(saved)) i18n.locale = saved;
  } catch { /* usa locale del dispositivo */ }
}

export async function setLocale(locale: Locale) {
  i18n.locale = locale;
  await SecureStore.setItemAsync(LANG_KEY, locale);
}

// t() helper corto
export const t = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);
