import type { StaticUser } from '@marcsimolduressonsardina/contracts/type';

export class UserService {
	public static generateStaticUser(id: string, name: string, storeId: string): StaticUser {
		return {
			id,
			storeId,
			name
		};
	}
}
