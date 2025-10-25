import { FullOrder } from './order.type';

export type OrderSet = {
	id: string;
	hash: string;
	storeId: string;
	createdAt: Date;
	createdBy: string;
	orders: Record<string, FullOrder>;
};
