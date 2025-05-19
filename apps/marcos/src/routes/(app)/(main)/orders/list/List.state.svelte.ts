import { browser } from '$app/environment';
import { orderStatusMap } from '@/shared/mappings/order.mapping';
import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
import { getGlobalProfiler } from '@/state/profiler/profiler.state';
import { OrderStatus } from '@marcsimolduressonsardina/core/type';
import type { FullOrder } from '@marcsimolduressonsardina/core/type';

interface ListState {
	getSearchValue: () => string;
	inputSearchValue: (value: string) => void;
	getOrders: () => Promise<FullOrder[]> | undefined;
	getPaginatedOrders: () => Promise<FullOrder[]> | undefined;
	getPaginationAvailable: () => boolean;
	setStatus: (value: OrderStatus) => void;
	getStatus: () => OrderStatus;
	triggerPagination: () => void;
	getShowMinCharsAlert: () => boolean;
	getIsSearchMode: () => boolean;
	getListTitle: () => string;
}

export class ListStateClass implements ListState {
	private timer: NodeJS.Timeout | undefined;
	private isAdmin: boolean = $state(false);
	private status: OrderStatus = $state(OrderStatus.PENDING);
	private searchValue: string = $state('');
	private orders: Promise<FullOrder[]> | undefined = $state(undefined);
	private paginatedOrders: Promise<FullOrder[]> | undefined = $state(undefined);
	private lastKey: Record<string, string | number> | undefined = $state();
	private showMinCharsAlert: boolean = $derived(
		this.searchValue.length > 0 && this.searchValue.length < 3
	);
	private paginationAvailable: boolean = $derived(
		this.searchValue.length === 0 && this.lastKey != null
	);
	private isSearchMode: boolean = $derived(this.searchValue.length > 0 || !this.isAdmin);
	private listTitle: string = $derived(
		this.status === OrderStatus.QUOTE
			? `Listado de ${orderStatusMap[this.status]}s`
			: `Pedidos ${orderStatusMap[this.status]}s`
	);

	constructor(initialStatus: OrderStatus, userIsAdmin: boolean) {
		const allowedStatus = [OrderStatus.QUOTE, OrderStatus.PENDING, OrderStatus.FINISHED];
		if (allowedStatus.includes(initialStatus)) {
			this.status = initialStatus;
		}

		this.isAdmin = userIsAdmin;
		this.orders = this.getList(this.status, this.lastKey);

		$effect(() => {
			if (!this.isSearchMode) {
				this.orders = this.getList(this.status, undefined);
			} else {
				this.paginatedOrders = undefined;
				this.orders = this.search(this.searchValue, this.status);
			}
		});
	}

	public getShowMinCharsAlert() {
		return this.showMinCharsAlert;
	}

	public getListTitle() {
		return this.listTitle;
	}

	public getSearchValue() {
		return this.searchValue;
	}

	public getOrders() {
		return this.orders;
	}

	public getIsSearchMode() {
		return this.isSearchMode;
	}

	public getPaginatedOrders() {
		return this.paginatedOrders;
	}

	public getPaginationAvailable() {
		return this.paginationAvailable;
	}

	public setStatus(value: OrderStatus) {
		this.status = value;
	}

	public getStatus() {
		return this.status;
	}

	public triggerPagination() {
		if (this.paginationAvailable) {
			this.paginatedOrders = this.getList(this.status, this.lastKey);
		}
	}

	public inputSearchValue(value: string) {
		clearTimeout(this.timer);
		this.searchValue = value;
		this.orders = undefined;
		this.lastKey = undefined;
		this.timer = setTimeout(() => {
			this.orders = this.search(value, this.status);
		}, 400);
	}

	private async getList(
		status: OrderStatus,
		lastKey: Record<string, string | number> | undefined
	): Promise<FullOrder[]> {
		if (!browser) {
			return [];
		}

		if (this.isAdmin) {
			const listResponse = fetch('/api/orders/list', {
				method: 'POST',
				body: JSON.stringify({ lastKey, status }),
				headers: {
					'content-type': 'application/json'
				}
			});

			const response = await getGlobalProfiler().measure(listResponse);
			const body: { orders: FullOrder[]; nextKey?: Record<string, string | number> } =
				await response.json();
			this.lastKey = body.nextKey;
			return OrderRepresentationUtilities.hydrateFullOrderDates(body.orders);
		} else {
			this.lastKey = undefined;
			return [];
		}
	}

	private async search(query: string, status: OrderStatus): Promise<FullOrder[]> {
		if (!browser) {
			return [];
		}

		if (query.length < 3) {
			return [];
		}

		const listResponse = fetch('/api/orders/search', {
			method: 'POST',
			body: JSON.stringify({ query, status }),
			headers: {
				'content-type': 'application/json'
			}
		});

		const response = await getGlobalProfiler().measure(listResponse);
		const body: { results: FullOrder[] } = await response.json();
		return OrderRepresentationUtilities.hydrateFullOrderDates(body.results);
	}
}
