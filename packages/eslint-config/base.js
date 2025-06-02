import js from '@eslint/js/src/index.js';
import eslintConfigPrettier from 'eslint-config-prettier';
import turboPlugin from 'eslint-plugin-turbo';
import tseslint from 'typescript-eslint';
// import onlyWarn from 'eslint-plugin-only-warn';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
	js.configs.recommended,
	eslintConfigPrettier,
	...tseslint.configs.recommended,
	{
		plugins: {
			turbo: turboPlugin
		},
		rules: {
			'turbo/no-undeclared-env-vars': 'warn'
		}
	},
	// {
	// 	plugins: {
	// 		onlyWarn
	// 	}
	// },
	{
		ignores: ['dist/**']
	},
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				// If you use type-aware linting, configure project paths here
				// project: true, // example
				// tsconfigRootDir: import.meta.dirname, // example
			}
		}
	}
];
