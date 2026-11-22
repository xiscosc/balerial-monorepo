import { ConfigRepositoryDynamoDb } from '@balerial/marcos-dynamo/config';
import type { ConfigDto } from '@marcsimolduressonsardina/contracts/dto';
import type { ICoreConfiguration } from '../configuration/core-configuration.interface';
import { LOCATIONS_CONFIG_ID, type LocationsConfigType } from './constants/config.constants';

export class ConfigService {
	private readonly repository: ConfigRepositoryDynamoDb;
	private readonly storeId: string;

	constructor(config: ICoreConfiguration) {
		this.storeId = config.storeId;
		this.repository = new ConfigRepositoryDynamoDb(config.configTable, this.storeId, {
			region: config.region,
			credentials: config.credentials
		});
	}

	public async getLocationsList(): Promise<LocationsConfigType> {
		const locations =
			await this.repository.getConfigValue<LocationsConfigType>(LOCATIONS_CONFIG_ID);

		if (locations == null) {
			return [];
		}

		return locations;
	}

	public async storeLocationsList(locations: LocationsConfigType) {
		const locationsDto: ConfigDto = {
			storeId: this.storeId,
			id: LOCATIONS_CONFIG_ID,
			value: locations
		};

		await this.repository.storeConfigValue(locationsDto);
	}
}
