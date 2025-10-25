import { type FullOrder, OrderStatus } from '@marcsimolduressonsardina/core/type';
import { SvelteMap } from 'svelte/reactivity';

export class OrderListState {
	private selectedOrders: Map<string, FullOrder>;
	private allOrders: Map<string, FullOrder>;
	private selectMode: boolean;
	private allOrdersFinished: boolean;

	constructor() {
		this.selectedOrders = new SvelteMap();
		this.allOrders = new SvelteMap();
		this.selectMode = $state(false);
		this.allOrdersFinished = $derived(
			!this.selectedOrders.values().some((fo) => fo.order.status !== OrderStatus.FINISHED)
		);
	}

	public getSelectedOrdersCount(): number {
		return this.selectedOrders.size;
	}

	public getSelectedOrdersIds(): string[] {
		return Array.from(this.selectedOrders.keys());
	}

	public setSelectedOrdersAsNotified(): void {
		this.selectedOrders.forEach((fullOrder) => {
			const updatedFullOrder = {
				...fullOrder,
				order: {
					...fullOrder.order,
					notified: true
				}
			};
			this.updateOrderInMaps(updatedFullOrder);
		});
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

	public getAllOrdersAreFinished(): boolean {
		return this.allOrdersFinished;
	}

	public clearState(): void {
		this.selectedOrders.clear();
		this.allOrders.clear();
		this.selectMode = false;
	}

	private updateOrderInMaps(updatedOrder: FullOrder): void {
		this.allOrders.set(updatedOrder.order.id, updatedOrder);
		if (this.selectedOrders.has(updatedOrder.order.id)) {
			this.selectedOrders.set(updatedOrder.order.id, updatedOrder);
		}
	}
}
