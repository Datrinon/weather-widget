/* eslint-disable linebreak-style */
/* eslint-disable no-undef */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    // 'airbnb-base',
    'eslint:recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    requireConfigFile: false,
  },
  parser: "@babel/eslint-parser", 
  rules: {
    "linebreak-style": ["error", "windows"],
  },
};
