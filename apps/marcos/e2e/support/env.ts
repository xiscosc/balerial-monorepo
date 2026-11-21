import { fileURLToPath } from 'node:url';

// Must match the port in the `dev:e2e` script and AUTH_AUTH0_ISSUER in apps/marcos/.env.e2e
export const BASE_URL = 'http://127.0.0.1:5174';

// Users of the mock OIDC server (apps/marcos-aws/local/oidc.json):
// `ext*` → external store with storeId = username, anything else → price manager in `local-store`
export const ROLES = {
	manager: 'e2e-manager',
	external: 'ext-e2e'
} as const;

export type Role = keyof typeof ROLES;

export const MAIN_STORE_ID = 'local-store';

export const authFile = (role: Role) =>
	fileURLToPath(new URL(`../../playwright/.auth/${role}.json`, import.meta.url));
