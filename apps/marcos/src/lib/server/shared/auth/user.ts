import { type Handle } from '@sveltejs/kit';
import { AuthService } from '$lib/server/service/auth.service';
import type { CustomSession } from '$lib/type/api.type';
import { ServiceFactory } from '@marcsimolduressonsardina/core/service';

export const getUserHandle: Handle = async ({ event, resolve }) => {
	const session = await event.locals.auth();
	const user = AuthService.generateUserFromAuth(session as CustomSession);
	event.locals.user = user;
	if (user) {
		const config = AuthService.generateConfiguration(user);
		event.locals.config = config;
		event.locals.services = ServiceFactory.create(config);
	}
	return resolve(event);
};
