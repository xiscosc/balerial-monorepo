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

export const cameraScenarios = ['existing-order', 'unknown-order', 'not-a-receipt'] as const;
export type CameraScenario = (typeof cameraScenarios)[number];

export const cameraVideoFile = (scenario: CameraScenario) =>
	fileURLToPath(new URL(`../../playwright/.camera/${scenario}.y4m`, import.meta.url));
