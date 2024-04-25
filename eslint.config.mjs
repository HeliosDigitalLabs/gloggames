import globals from "globals";
import { configs as pluginJsConfigs } from "@eslint/js";
import { rules as securityRules } from "eslint-plugin-security";

export default {
  // Define where your JavaScript files are and specify the environment
  files: ["**/*.js"],
  languageOptions: {
    sourceType: "script",
    ecmaVersion: 2020 // Adjust this according to what features you are using in your JS code
  },
  globals: globals.browser,
  // Use the recommended configs from the JS plugin
  extends: [pluginJsConfigs.recommended],
  // Add the security plugin
  plugins: ["security"],
  // Directly specify security rules if necessary
  rules: {
    "security/detect-buffer-noassert": "warn",
    "security/detect-child-process": "warn",
    "security/detect-disable-mustache-escape": "warn",
    "security/detect-eval-with-expression": "warn",
    "security/detect-no-csrf-before-method-override": "warn",
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-non-literal-require": "warn",
    "security/detect-object-injection": "warn",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-pseudoRandomBytes": "warn",
    "security/detect-unsafe-regex": "warn"
  }
};
