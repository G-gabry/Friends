import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en.json';
import arTranslation from '../locales/ar.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslation,
      ar: arTranslation,
    },
    fallbackLng: 'ar',
    debug: false,
    interpolation: {
      escapeValue: false, // React already safeguards from XSS
    },
  });

// Handle document direction and font upon language change
i18n.on('languageChanged', (lng) => {
  const isAr = lng === 'ar';
  document.documentElement.lang = lng;
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';
  // Note: specific fonts or CSS can be toggled here if needed.
});

// Run once on load to ensure HTML gets the correct dir
const currentLng = i18n.language || 'ar';
document.documentElement.lang = currentLng;
document.documentElement.dir = currentLng === 'ar' ? 'rtl' : 'ltr';

export default i18n;
