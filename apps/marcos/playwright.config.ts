import { defineConfig, devices } from '@playwright/test';
import { authFile, BASE_URL } from './e2e/support/env';

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
		launchOptions: { executablePath: process.env.E2E_CHROMIUM_PATH || undefined }
	},
	projects: [
		{ name: 'setup', testMatch: /.*\.setup\.ts/ },
		{
			name: 'manager',
			testMatch: /.*\.manager\.spec\.ts/,
			dependencies: ['setup'],
			use: { storageState: authFile('manager') }
		},
		{
			name: 'staff',
			testMatch: /.*\.staff\.spec\.ts/,
			dependencies: ['setup'],
			use: { storageState: authFile('staff') }
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
