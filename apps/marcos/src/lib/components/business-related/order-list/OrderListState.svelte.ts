import type { FullOrder } from '@marcsimolduressonsardina/core/type';
import { SvelteMap } from 'svelte/reactivity';

export class OrderListState {
	private selectedOrders: Map<string, FullOrder>;
	private allOrders: Map<string, FullOrder>;
	private selectMode: boolean;

	constructor() {
		this.selectedOrders = new SvelteMap();
		this.allOrders = new SvelteMap();
		this.selectMode = $state(false);
	}

	public getSelectedOrdersCount(): number {
		return this.selectedOrders.size;
	}

	public selectOrder(orderId: string): void {
		const fullOrder = this.allOrders.get(orderId);
		if (!fullOrder) {
			throw new Error(`Order with ID ${orderId} not found in allOrders.`);
		}
		this.selectedOrders.set(fullOrder.order.id, fullOrder);
	}

	public isOrderSelected(orderId: string): boolean {
		return this.selectedOrders.has(orderId);
	}

	public selectAllOrders(): void {
		this.allOrders.forEach((order, orderId) => {
			this.selectedOrders.set(orderId, order);
		});
	}

	public unSelectOrder(orderId: string): void {
		this.selectedOrders.delete(orderId);
	}

	public clearSelectedOrders(): void {
		this.selectedOrders.clear();
	}

	public getOrdersCount(): number {
		return this.allOrders.size;
	}

	public addOrders(orders: FullOrder[]): void {
		orders.forEach((order) => {
			this.allOrders.set(order.order.id, order);
		});
	}

	public getAllOrders(): FullOrder[] {
		return Array.from(this.allOrders.values());
	}

	public isSelectMode(): boolean {
		return this.selectMode;
	}

	public setSelectMode(value: boolean): void {
		this.selectMode = value;
		if (!value) {
			this.clearSelectedOrders();
		}
	}
}
