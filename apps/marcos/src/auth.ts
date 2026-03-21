import { betterAuth } from 'better-auth';
import { genericOAuth } from 'better-auth/plugins';
import {
	AUTH_SECRET,
	AUTH_AUTH0_ID,
	AUTH_AUTH0_SECRET,
	AUTH_AUTH0_ISSUER
} from '$env/static/private';
import { dev } from '$app/environment';

const auth0Issuer = AUTH_AUTH0_ISSUER.replace(/\/$/, '');

export const auth = betterAuth({
	secret: AUTH_SECRET,
	logger: dev ? { level: 'debug' } : undefined,
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: 'auth0',
					clientId: AUTH_AUTH0_ID,
					clientSecret: AUTH_AUTH0_SECRET,
					discoveryUrl: `${auth0Issuer}/.well-known/openid-configuration`,
					scopes: ['openid', 'profile', 'email'],
					mapProfileToUser: (profile) => {
						const metadata = profile.app_metadata as
							| Record<string, unknown>
							| undefined;
						return {
							storeId: (metadata?.storeId as string) ?? '',
							priceManager: (metadata?.priceManager as boolean) ?? false
						} as Record<string, unknown>;
					}
				}
			]
		})
	],
	user: {
		additionalFields: {
			storeId: {
				type: 'string',
				required: false,
				defaultValue: '',
				input: false
			},
			priceManager: {
				type: 'boolean',
				required: false,
				defaultValue: false,
				input: false
			}
		}
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 7 * 24 * 60 * 60,
			strategy: 'jwe'
		}
	},
	account: {
		storeStateStrategy: 'cookie',
		storeAccountCookie: true
	}
});

export type BetterAuthSession = typeof auth.$Infer.Session;
