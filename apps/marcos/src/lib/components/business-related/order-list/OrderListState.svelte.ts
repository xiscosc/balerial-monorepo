import { type Customer, type FullOrder, OrderStatus } from '@marcsimolduressonsardina/core/type';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { BatchOperation } from '@/type/api.type';

export class OrderListState {
	private selectedOrders: Map<string, FullOrder>;
	private allOrders: Map<string, FullOrder>;
	private selectMode: boolean;
	private selectedOrdersFinished: boolean;
	private selectedQuotes: boolean;
	private selectedOrdersAreFromSameCustomer: boolean;

	constructor() {
		this.selectedOrders = new SvelteMap();
		this.allOrders = new SvelteMap();
		this.selectMode = $state(false);
		this.selectedOrdersFinished = $derived(
			!this.selectedOrders.values().some((fo) => fo.order.status !== OrderStatus.FINISHED)
		);
		this.selectedQuotes = $derived(
			this.selectedOrders.values().some((fo) => fo.order.status === OrderStatus.QUOTE)
		);
		this.selectedOrdersAreFromSameCustomer = $derived(
			new SvelteSet(this.selectedOrders.values().map((fo) => fo.order.customer.id)).size === 1
		);
	}

	public getSelectedOrdersCount(): number {
		return this.selectedOrders.size;
	}

	public getSelectedOrdersIds(): string[] {
		return Array.from(this.selectedOrders.keys());
	}

	public getSelectedOrders(): FullOrder[] {
		return Array.from(this.selectedOrders.values());
	}

	public getCustomerFromFirstSelectedOrder(): Customer {
		const firstSelectedOrder = this.selectedOrders.values().next().value;
		return firstSelectedOrder!.order.customer;
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

	public runBulkOperation(operation: BatchOperation) {
		switch (operation) {
			case BatchOperation.NOTIFY_ORDERS:
				this.setSelectedOrdersAsNotified();
				break;
			case BatchOperation.SET_PICKED_UP:
				this.setSelectedOrdersAsPickedUp();
				break;
			case BatchOperation.SET_PAID:
				this.setSelectedOrdersAsPayed();
				break;
			case BatchOperation.SET_INVOICED:
				this.setSelectedOrdersAsInvoiced();
				break;
			default:
				return;
		}
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

	public getSelectedOrdersAreFinished(): boolean {
		return this.selectedOrdersFinished;
	}

	public getSelectedQuotesExist(): boolean {
		return this.selectedQuotes;
	}

	public getSelectedOrdersAreFromSameCustomer(): boolean {
		return this.selectedOrdersAreFromSameCustomer;
	}

	public clearState(): void {
		this.selectedOrders.clear();
		this.allOrders.clear();
		this.selectMode = false;
	}

	private setSelectedOrdersAsNotified(): void {
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

	private setSelectedOrdersAsPickedUp(): void {
		this.selectedOrders.forEach((fullOrder) => {
			const updatedFullOrder = {
				...fullOrder,
				order: {
					...fullOrder.order,
					status: OrderStatus.PICKED_UP
				}
			};
			this.updateOrderInMaps(updatedFullOrder);
		});
	}

	private setSelectedOrdersAsInvoiced(): void {
		this.selectedOrders.forEach((fullOrder) => {
			const updatedFullOrder = {
				...fullOrder,
				order: {
					...fullOrder.order,
					invoiced: true
				}
			};
			this.updateOrderInMaps(updatedFullOrder);
		});
	}

	private setSelectedOrdersAsPayed(): void {
		this.selectedOrders.forEach((fullOrder) => {
			const updatedFullOrder = {
				...fullOrder,
				totals: {
					...fullOrder.totals,
					payed: true
				}
			};
			this.updateOrderInMaps(updatedFullOrder);
		});
	}

	private updateOrderInMaps(updatedOrder: FullOrder): void {
		this.allOrders.set(updatedOrder.order.id, updatedOrder);
		if (this.selectedOrders.has(updatedOrder.order.id)) {
			this.selectedOrders.set(updatedOrder.order.id, updatedOrder);
		}
	}
}
