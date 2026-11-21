import { defineConfig, devices } from '@playwright/test';
import { authFile, BASE_URL } from './e2e/support/env';

// Same config locally and in CI. The emulators (AWS + mock OIDC) must already be up and seeded:
// `bun run test:e2e` from the repo root does that with Docker, CI uses
// apps/marcos-aws/local/e2e-native.sh. Playwright starts the app itself.
const CI = !!process.env.CI;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: CI,
	retries: CI ? 1 : 0,
	reporter: CI
		? [['github'], ['html', { open: 'never' }]]
		: [['list'], ['html', { open: 'never' }]],
	use: {
		...devices['Desktop Chrome'],
		baseURL: BASE_URL,
		locale: 'es-ES',
		timezoneId: 'Europe/Madrid',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		// Only for machines whose Chromium doesn't match this Playwright version (e.g. a preinstalled one)
		launchOptions: { executablePath: process.env.E2E_CHROMIUM_PATH || undefined }
	},
	projects: [
		// Logs in once per role and stores the session (see e2e/auth.setup.ts)
		{ name: 'setup', testMatch: /.*\.setup\.ts/ },
		// The file suffix picks who the test runs as
		{
			name: 'manager',
			testMatch: /.*\.manager\.spec\.ts/,
			dependencies: ['setup'],
			use: { storageState: authFile('manager') }
		},
		{
			name: 'external',
			testMatch: /.*\.external\.spec\.ts/,
			dependencies: ['setup'],
			use: { storageState: authFile('external') }
		},
		{ name: 'anonymous', testMatch: /.*\.public\.spec\.ts/ }
	],
	webServer: {
		command: 'bun run dev:e2e',
		url: BASE_URL,
		reuseExistingServer: !CI,
		timeout: 120_000
	}
});
