import { defineConfig, devices } from '@playwright/test';
import { authFile, BASE_URL, cameraScenarios, cameraVideoFile } from './e2e/support/env';

const CI = !!process.env.CI;
const executablePath = process.env.E2E_CHROMIUM_PATH || undefined;

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: true,
	forbidOnly: CI,
	retries: CI ? 1 : 0,
	expect: { timeout: CI ? 10_000 : 5_000 },
	reporter: CI
		? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-results.json' }]]
		: [['list'], ['html', { open: 'never' }]],
	use: {
		...devices['Galaxy S24'],
		baseURL: BASE_URL,
		locale: 'es-ES',
		timezoneId: 'Europe/Madrid',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		launchOptions: { executablePath }
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
		{ name: 'anonymous', testMatch: /.*\.public\.spec\.ts/ },
		...cameraScenarios.map((scenario) => ({
			name: `manager (camera: ${scenario})`,
			testMatch: new RegExp(`scan-${scenario}\\.manager\\.camera\\.spec\\.ts$`),
			dependencies: ['setup'],
			use: {
				storageState: authFile('manager'),
				permissions: ['camera'],
				launchOptions: {
					executablePath,
					args: [
						'--use-fake-ui-for-media-stream',
						'--use-fake-device-for-media-stream',
						`--use-file-for-fake-video-capture=${cameraVideoFile(scenario)}`
					]
				}
			}
		})),
		{
			name: 'manager (last)',
			testMatch: /.*\.manager\.last\.spec\.ts/,
			dependencies: ['manager', 'staff', 'external', 'anonymous'],
			use: { storageState: authFile('manager') }
		}
	],
	webServer: {
		command: 'bun run dev:e2e',
		url: BASE_URL,
		reuseExistingServer: !CI,
		timeout: 120_000
	}
});
