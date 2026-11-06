import { type ICoreConfiguration } from './core-configuration.interface';

export function getClientConfiguration(config: ICoreConfiguration) {
	return {
		region: config.region,
		credentials: config.credentials
	};
}
