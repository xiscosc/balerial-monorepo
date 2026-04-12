import { redirect, type Handle } from '@sveltejs/kit';
import { AuthService } from '$lib/server/service/auth.service';
import { ServiceFactory } from '@marcsimolduressonsardina/core/service';
import { auth } from '../../../../auth';

export const getUserHandle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});
	const user = AuthService.generateUserFromAuth(session);
	event.locals.user = user;
	if (user) {
		const config = AuthService.generateConfiguration(user);
		event.locals.config = config;
		event.locals.services = ServiceFactory.create(config);
	} else if (event.route.id?.startsWith('/(app)') && !event.url.pathname.startsWith('/api')) {
		redirect(303, '/auth/signin?callbackUrl=/');
	}
	return resolve(event);
};
