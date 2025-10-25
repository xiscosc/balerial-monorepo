import { FullOrder } from './order.type';
import { StaticUser } from './user.type';

export type OrderSet = {
	id: string;
	hash: string;
	createdAt: Date;
	createdBy: StaticUser;
	orders: Record<string, FullOrder>;
};
