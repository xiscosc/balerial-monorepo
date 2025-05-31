import { config as base } from './base.js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

// Import the custom rule implementation
// Ensure 'enforce-breakpointstate-destroy.js' is in 'packages/eslint-config/rules/'
import enforceBreakpointstateDestroyRule from './rules/enforce-breakpointstate-destroy.js';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
	...base,
	...svelte.configs['flat/recommended'],
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		plugins: {
			// Define a local plugin namespace for your custom rule
			'custom-svelte': {
				rules: {
					'enforce-breakpointstate-destroy': enforceBreakpointstateDestroyRule
				}
			}
		},
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			// Enable your custom rule with a severity
			'custom-svelte/enforce-breakpointstate-destroy': 'error' // Or 'error'
			// ... any other Svelte-specific rules can go here
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/,', '.vercel/']
	}
];
