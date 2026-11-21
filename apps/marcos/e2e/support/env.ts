import { fileURLToPath } from 'node:url';

export const BASE_URL = 'http://127.0.0.1:5174';

export const ROLES = {
	manager: 'e2e-manager',
	staff: 'staff-e2e',
	external: 'ext-e2e'
} as const;

export type Role = keyof typeof ROLES;

export const MAIN_STORE_ID = 'local-store';

export const authFile = (role: Role) =>
	fileURLToPath(new URL(`../../playwright/.auth/${role}.json`, import.meta.url));
