import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
	plugins: [tailwindcss(), sveltekit()],
	server:
		mode === 'offline' || mode === 'e2e'
			? {
					proxy: {
						'/__aws': {
							target: 'https://127.0.0.1:9297',
							secure: false,
							changeOrigin: true,
							rewrite: (path) => path.replace(/^\/__aws/, '')
						},
						'/__oidc/oauth/token': {
							target: 'http://127.0.0.1:9298',
							changeOrigin: true,
							rewrite: () => '/default/token'
						},
						'/__oidc': {
							target: 'http://127.0.0.1:9298',
							changeOrigin: true,
							rewrite: (path) => path.replace(/^\/__oidc/, '/default')
						}
					}
				}
			: undefined
}));
