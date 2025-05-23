import { config as baseSvelteConfig } from '@repo/eslint-config/svelte';

/** @type {import("eslint").Linter.Config} */
export default [
	...baseSvelteConfig,
	{
		ignores: ['src/lib/components/ui/**']
	}
];
