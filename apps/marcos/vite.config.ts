import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';

function computeBaseUrl(env: Record<string, string>): void {
	const envName = env.ENV_NAME;
	if (envName === 'prod' || envName === 'pre') {
		process.env.PUBLIC_BASE_URL = env.VERCEL_PROJECT_PRODUCTION_URL;
	} else {
		process.env.PUBLIC_BASE_URL = env.VERCEL_URL;
	}
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');
	computeBaseUrl(env);

	return {
		plugins: [tailwindcss(), sveltekit()],
		optimizeDeps: {
			esbuildOptions: {
				supported: {
					bigint: true
				}
			}
		}
	};
});
