import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { auth } from './auth';
import { ServerTracking } from '@/server/shared/tracking';
import { getUserHandle } from '@/server/shared/auth/user';
import { apiAuthHandle } from '@/server/shared/auth/api';
import { maintenanceHandle } from '@/server/shared/maintenance';
import type { Handle } from '@sveltejs/kit';

const betterAuthHandle: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

export const handle = sequence(
	ServerTracking.contextHandle,
	maintenanceHandle,
	betterAuthHandle,
	getUserHandle,
	apiAuthHandle
);
export const handleError = ServerTracking.handleError;
