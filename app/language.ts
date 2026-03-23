export type AppLanguage = 'bg' | 'en';

export const LANGUAGE_STORAGE_KEY = 'zytrix-language';

export function getStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'en';

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (stored === 'bg' || stored === 'en') {
    return stored;
  }

  return 'en';
}

export function setStoredLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}