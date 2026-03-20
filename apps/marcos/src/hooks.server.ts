import { sequence } from '@sveltejs/kit/hooks';
import { authHandle } from './auth';
import { ServerTracking } from '@/server/shared/tracking';
import { getUserHandle } from '@/server/shared/auth/user';
import { apiAuthHandle } from '@/server/shared/auth/api';
import { maintenanceHandle } from '@/server/shared/maintenance';

export const handle = sequence(
	ServerTracking.contextHandle,
	maintenanceHandle,
	authHandle,
	getUserHandle,
	apiAuthHandle
);
export const handleError = ServerTracking.handleError;
