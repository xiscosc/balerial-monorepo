import { Debounced, watch } from 'runed';
import { browser } from '$app/environment';
import { OrderApiGateway } from '@/gateway/order-api.gateway';
import { orderStatusMap } from '@/shared/mappings/order.mapping';
import { getGlobalProfiler } from '@/state/profiler/profiler.state';
import { OrderStatus } from '@marcsimolduressonsardina/core/type';
import type { FullOrder } from '@marcsimolduressonsardina/core/type';
import { ActionBarState } from '@/state/action-bar/action-bar.state.svelte';

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
	private isLoading: boolean = $state(false);
	private isAdmin: boolean = $state(false);
	private status: OrderStatus = $state(OrderStatus.PENDING);
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
			}
		});

		$effect(() => {
			if (this.isSearchMode && this.searchValueDebounced.current.length >= 3) {
				this.orders = this.search(this.searchValueDebounced.current, this.status);
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
		ActionBarState.destroy();
		this.status = value;

		if (this.searchValueDebounced.current.length >= 3) {
			this.orders = this.search(this.searchValueDebounced.current, this.status);
		}
	}

	public getIsLoading() {
		return this.isLoading;
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
		ActionBarState.destroy();
		this.searchValue = value;
		this.lastKey = undefined;
	}

	private async getList(
		status: OrderStatus,
		lastKey: Record<string, string | number> | undefined
	): Promise<FullOrder[]> {
		if (!browser) {
			return [];
		}

		if (this.isAdmin) {
			const response = await getGlobalProfiler().measure(
				OrderApiGateway.getOrderList(status, lastKey)
			);
			const body = response;
			this.lastKey = body.nextKey;
			return body.orders;
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

		const response = await getGlobalProfiler().measure(OrderApiGateway.searchOrders(query, status));
		return response;
	}
}
