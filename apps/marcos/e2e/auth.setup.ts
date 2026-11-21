import { test as setup, expect } from '@playwright/test';
import { authFile, ROLES, type Role } from './support/env';

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
