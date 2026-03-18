import { type Handle } from '@sveltejs/kit';
import { AuthService } from '$lib/server/service/auth.service';
import type { CustomSession } from '$lib/type/api.type';

export const getUserHandle: Handle = async ({ event, resolve }) => {
	const session = await event.locals.auth();
	const user = AuthService.generateUserFromAuth(session as CustomSession);
	event.locals.user = user;
	if (user) {
		event.locals.config = AuthService.generateConfiguration(user);
	}
	return resolve(event);
};
