import { sequence } from '@sveltejs/kit/hooks';
import { authHandle } from './auth';
import { ServerTracking } from '@/server/shared/tracking';
import { getUserHandle } from '@/server/shared/auth/user';
import { apiAuthHandle } from '@/server/shared/auth/api';

export const handle = sequence(authHandle, getUserHandle, apiAuthHandle, ServerTracking.contextHandle);
export const handleError = ServerTracking.handleError;
