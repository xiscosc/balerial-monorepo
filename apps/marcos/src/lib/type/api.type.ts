import type { OrderDimensions, PreCalculatedItemPart } from '@marcsimolduressonsardina/core/type';

export type PreCalculatedItemPartRequest = {
	partsToCalculateWithKey: { key: string; part: PreCalculatedItemPart }[];
	orderDimensions: OrderDimensions;
	markup?: number;
};

export enum BatchOperation {
	NOTIFY_ORDERS = 'NOTIFY_ORDERS',
	SET_INVOICED = 'SET_INVOICED',
	SET_PAID = 'SET_PAID',
	SET_PICKED_UP = 'SET_PICKED_UP'
}
