// @ts-check

import { URL, fileURLToPath } from "url";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: ["build/"],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	...tseslint.configs.stylisticTypeChecked,
	{
		languageOptions: {
			parserOptions: {
				project: ["./tsconfig.json"],
				tsconfigRootDir: fileURLToPath(new URL(".", import.meta.url)),
			}
		},
		rules: {
			"indent": [
				"warn",
				"tab",
				{
					ignoredNodes: [
						"* > TemplateLiteral",
						"TemplateLiteral ~ *",
						"SwitchCase",
						"ConditionalExpression",
					],
				}
			],
			"linebreak-style": "off",
			"semi": ["error", "always"],
			"no-unused-vars": "off",
			"prefer-const": "warn",
			"no-unexpected-multiline": "off",
			"@typescript-eslint/no-unused-expressions": ["warn", {"allowTaggedTemplates": true}],
			"no-empty": ["warn", {"allowEmptyCatch": true}],
			"@typescript-eslint/no-unused-vars": "off",
			"@typescript-eslint/no-unsafe-function-type": "off",
			"@typescript-eslint/no-empty-object-type": "off",
			"@typescript-eslint/prefer-promise-reject-errors": "off",
			"@typescript-eslint/consistent-type-definitions": ["error", "type"],
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-this-alias": "off",
			"@typescript-eslint/prefer-regexp-exec": "off",
			"@typescript-eslint/array-type": ["error", {default: "array-simple"}],
			"@typescript-eslint/restrict-template-expressions": ["error", {
				allowNullish: false,
			}],
			"@typescript-eslint/no-empty-function": ["warn", {
				allow: ["arrowFunctions"]
			}]
		},
	},
	{
		files: ["eslint.config.js"],
		extends: [tseslint.configs.disableTypeChecked],
	},
);
