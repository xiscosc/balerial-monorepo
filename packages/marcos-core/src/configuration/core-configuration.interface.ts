import { type AwsCredentialIdentity } from '@smithy/types';
import { type AppUser } from '../types/user.type';

export interface ICoreConfiguration {
	storeId: string;
	orderTable?: string;
	customerTable?: string;
	configTable?: string;
	calculatedItemTable?: string;
	fileTable?: string;
	listPricingTable?: string;
	orderAuditTrailTable?: string;
	filesBucket?: string;
	moldPricesBucket?: string;
	orderSetTable?: string;
	user: AppUser;
	disableOrderAuditTrail?: boolean;
	region: string;
	credentials: AwsCredentialIdentity;
}

export const PUBLIC_REPOSITORY = 'public-repo';

export interface ICorePublicConfiguration extends ICoreConfiguration {
	storeId: 'public-repo';
}
