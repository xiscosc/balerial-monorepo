import { Debounced, watch } from 'runed';
import { browser } from '$app/environment';
import { OrderApiGateway } from '@/gateway/order-api.gateway';
import { OrderStatus } from '@marcsimolduressonsardina/core/type';
import type { FullOrder } from '@marcsimolduressonsardina/core/type';
import { ActionBarState } from '@/state/action-bar/action-bar.state.svelte';

export type OrderListSort = 'newest' | 'oldest';

interface ListState {
	getSearchValue: () => string;
	inputSearchValue: (value: string) => void;
	getOrders: () => Promise<FullOrder[]> | undefined;
	getPaginatedOrders: () => Promise<FullOrder[]> | undefined;
	getPaginationAvailable: () => boolean;
	setFilter: (status: OrderStatus, unlinkedOnly?: boolean) => void;
	getStatus: () => OrderStatus;
	getUnlinkedOnly: () => boolean;
	setSort: (value: OrderListSort) => void;
	getSort: () => OrderListSort;
	triggerPagination: () => void;
	getShowMinCharsAlert: () => boolean;
	getIsSearchMode: () => boolean;
	getListTitle: () => string;
}

export class ListStateClass implements ListState {
	private isLoading: boolean = $state(false);
	private isAdmin: boolean = $state(false);
	private status: OrderStatus = $state(OrderStatus.PENDING);
	private unlinkedOnly: boolean = $state(false);
	private sort: OrderListSort = $state('newest');
	private searchValue: string = $state('');
	private searchValueDebounced: Debounced<string> = new Debounced(() => this.searchValue, 400);
	private orders: Promise<FullOrder[]> | undefined = $state(undefined);
	private paginatedOrders: Promise<FullOrder[]> | undefined = $state(undefined);
	private lastKey: Record<string, string | number> | undefined = $state();
	private showMinCharsAlert: boolean = $derived(
		this.searchValueDebounced.current.length > 0 && this.searchValueDebounced.current.length < 3
	);
	private paginationAvailable: boolean = $derived(
		this.searchValueDebounced.current.length === 0 && this.lastKey != null
	);
	private isSearchMode: boolean = $derived(
		this.searchValueDebounced.current.length > 0 || !this.isAdmin
	);

	constructor(initialStatus: OrderStatus, userIsAdmin: boolean) {
		const allowedStatus = [
			OrderStatus.QUOTE,
			OrderStatus.PENDING,
			OrderStatus.FINISHED,
			OrderStatus.PICKED_UP
		];
		if (allowedStatus.includes(initialStatus)) {
			this.status = initialStatus;
		}

		this.isAdmin = userIsAdmin;

		$effect(() => {
			const status = this.status;
			const unlinkedOnly = this.unlinkedOnly;
			const descendent = this.sort === 'newest';
			if (!this.isSearchMode) {
				this.orders = this.getList(status, unlinkedOnly, descendent, undefined);
			} else {
				this.paginatedOrders = undefined;
			}
		});

		$effect(() => {
			const query = this.searchValueDebounced.current;
			const status = this.status;
			const unlinkedOnly = this.unlinkedOnly;
			const descendent = this.sort === 'newest';
			if (this.isSearchMode && query.length >= 3) {
				this.orders = this.search(query, status, unlinkedOnly, descendent);
			}
		});

		watch(
			() => this.orders,
			() => {
				this.isLoading = true;
				this.orders
					?.then(() => {
						this.isLoading = false;
					})
					.catch(() => {
						this.isLoading = false;
					});
			}
		);
	}

	public getShowMinCharsAlert() {
		return this.showMinCharsAlert;
	}

	public getListTitle() {
		switch (this.status) {
			case OrderStatus.QUOTE:
				return 'Presupuestos';
			case OrderStatus.FINISHED:
				return 'Pedidos finalizados';
			case OrderStatus.PICKED_UP:
				return 'Pedidos recogidos';
			default:
				return 'Pedidos pendientes';
		}
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

	public setFilter(status: OrderStatus, unlinkedOnly: boolean = false) {
		if (this.status === status && this.unlinkedOnly === unlinkedOnly) return;

		ActionBarState.destroy();
		this.status = status;
		this.unlinkedOnly = unlinkedOnly;
		this.lastKey = undefined;
		this.paginatedOrders = undefined;
	}

	public getIsLoading() {
		return this.isLoading;
	}

	public getStatus() {
		return this.status;
	}

	public getUnlinkedOnly() {
		return this.unlinkedOnly;
	}

	public setSort(value: OrderListSort) {
		if (this.sort === value) return;

		ActionBarState.destroy();
		this.sort = value;
		this.lastKey = undefined;
		this.paginatedOrders = undefined;
	}

	public getSort() {
		return this.sort;
	}

	public triggerPagination() {
		if (this.paginationAvailable) {
			this.paginatedOrders = this.getList(
				this.status,
				this.unlinkedOnly,
				this.sort === 'newest',
				this.lastKey
			);
		}
	}

	public inputSearchValue(value: string) {
		ActionBarState.destroy();
		this.searchValue = value;
		this.lastKey = undefined;
	}

	private async getList(
		status: OrderStatus,
		unlinkedOnly: boolean,
		descendent: boolean,
		lastKey: Record<string, string | number> | undefined
	): Promise<FullOrder[]> {
		if (!browser) {
			return [];
		}

		if (this.isAdmin) {
			const response = await OrderApiGateway.getOrderList(
				{ status, unlinkedOnly, descendent },
				lastKey
			);
			const body = response;
			if (
				this.status === status &&
				this.unlinkedOnly === unlinkedOnly &&
				(this.sort === 'newest') === descendent
			) {
				this.lastKey = body.nextKey;
			}
			return body.orders;
		} else {
			this.lastKey = undefined;
			return [];
		}
	}

	private async search(
		query: string,
		status: OrderStatus,
		unlinkedOnly: boolean,
		descendent: boolean
	): Promise<FullOrder[]> {
		if (!browser) {
			return [];
		}

		if (query.length < 3) {
			return [];
		}

		const response = await OrderApiGateway.searchOrders(query, {
			status,
			unlinkedOnly,
			descendent
		});
		return response;
	}
}
