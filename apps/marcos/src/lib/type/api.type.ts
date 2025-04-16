import type { Session } from '@auth/sveltekit';
import type { OrderDimensions, PreCalculatedItemPart } from '@marcsimolduressonsardina/core/type';

export type UserMetadata = {
	priceManager?: boolean;
	storeId?: string;
};

export type WithMetadata = {
	userMetadata: UserMetadata;
};

export type CustomSession = WithMetadata & Session;

export type PreCalculatedItemPartRequest = {
	partToCalculate: PreCalculatedItemPart;
	orderDimensions: OrderDimensions;
	markup?: number;
};
