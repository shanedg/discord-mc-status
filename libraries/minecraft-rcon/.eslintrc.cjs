module.exports = {
  env: {
    node: true,
    es2021: true // ecmaVersion 12
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12, // es2021
    sourceType: 'module'
  },
  rules: {
    indent: [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    quotes: [
      'error',
      'single'
    ],
    semi: [
      'error',
      'always'
    ]
  }
};
