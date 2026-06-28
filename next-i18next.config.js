/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'te'],
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
