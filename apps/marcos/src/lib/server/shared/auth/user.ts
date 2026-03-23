import { type Handle } from '@sveltejs/kit';
import { AuthService } from '$lib/server/service/auth.service';
import type { CustomSession } from '$lib/type/api.type';
import { ServiceFactory } from '@marcsimolduressonsardina/core/service';
import { ServerTracking } from '$lib/server/shared/tracking';

export const getUserHandle: Handle = async ({ event, resolve }) => {
	const session = await event.locals.auth();
	const user = AuthService.generateUserFromAuth(session as CustomSession);
	event.locals.user = user;
	if (user) {
		const config = AuthService.generateConfiguration(user);
		event.locals.config = config;
		event.locals.services = ServiceFactory.create(config);
	} else if (event.route.id?.startsWith('/(app)')) {
		ServerTracking.anonymousEvent('invalid_session', {
			context: event.locals.trackingContext,
			properties: {
				url: event.url.pathname,
				hasSession: session != null,
				hasUser: session?.user != null,
				hasEmail: session?.user?.email != null,
				hasMetadata: (session as CustomSession)?.userMetadata != null,
				hasStoreId: (session as CustomSession)?.userMetadata?.storeId != null
			}
		});
	}
	return resolve(event);
};
