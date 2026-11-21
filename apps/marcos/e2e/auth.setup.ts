import { test as setup, expect } from '@playwright/test';
import { authFile, ROLES, type Role } from './support/env';

// Real login flow: /auth/signin → better-auth → mock OIDC login form (proxied at /__oidc) → back to the app.
// The stored session is reused by every test of that role, see the projects in playwright.config.ts.
for (const role of Object.keys(ROLES) as Role[]) {
	setup(`login as ${role}`, async ({ page }) => {
		await page.goto('/auth/signin');
		await page.locator('input[name="username"]').fill(ROLES[role]);
		await page.getByRole('button', { name: 'Sign-in' }).click();
		await page.waitForURL(
			(url) => !['/__oidc', '/api/auth', '/auth'].some((p) => url.pathname.startsWith(p))
		);
		await expect(page).not.toHaveURL(/\/error/);
		await page.context().storageState({ path: authFile(role) });
	});
}
