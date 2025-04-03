module.exports = {
  extends: 'airbnb-base',
  rules: {
    'import/extensions': 'off',
  },
  // env: { browser: true, es2024: true },
};

// module.exports = {
//   root: true,
//   env: { browser: true, es2020: true },
//   extends: "airbnb-base",
//   ignorePatterns: ["dist", ".eslintrc.cjs"],

//   parserOptions: { ecmaVersion: "latest", sourceType: "module" },
//   rules: {
//     "no-debugger": process.env.NODE_ENV === "production" ? 2 : 0,
//   },
// };
