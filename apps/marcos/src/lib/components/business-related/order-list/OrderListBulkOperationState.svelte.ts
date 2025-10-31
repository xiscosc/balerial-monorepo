import { BatchOperation } from '@/type/api.type';
import {
	orderBatchOperationActionMap,
	orderBatchOperationTitleMap
} from '@/shared/mappings/order.mapping';
import { OrderApiGateway } from '@/gateway/order-api.gateway';
import { getGlobalProfiler } from '@/state/profiler/profiler.state';
import type { OrderListState } from '@/components/business-related/order-list/OrderListState.svelte';
import { OrderSetApiGateway } from '@/gateway/order-set-api.gateway';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

export class OrderListBulkOperationState {
	private active: boolean;
	private actionText: string;
	private acceptText: string;
	private loading: boolean;
	private accepted: boolean;
	private whatsappButtonVisible: boolean;
	private orderSetCurrentOperation?: BatchOperation;

	constructor(private orderListState: OrderListState) {
		this.active = $state(false);
		this.actionText = $state('');
		this.acceptText = $state('');
		this.loading = $state(false);
		this.accepted = $state(false);
		this.whatsappButtonVisible = $state(false);
		this.orderSetCurrentOperation = $state(undefined);

		this.isBulkOrderActive = this.isBulkOrderActive.bind(this);
		this.setBulkOrderInactive = this.setBulkOrderInactive.bind(this);
		this.acceptBulkOperation = this.acceptBulkOperation.bind(this);
		this.isBulkOperationAccepted = this.isBulkOperationAccepted.bind(this);
		this.getBulkOperationAcceptText = this.getBulkOperationAcceptText.bind(this);
		this.isBulkOperationLoading = this.isBulkOperationLoading.bind(this);
		this.getBulkOperationActionText = this.getBulkOperationActionText.bind(this);
		this.isWhatsappButtonVisible = this.isWhatsappButtonVisible.bind(this);
		this.prepareBulkOperation = this.prepareBulkOperation.bind(this);
		this.generateOrderSet = this.generateOrderSet.bind(this);
		this.runBulkOperation = this.runBulkOperation.bind(this);
	}

	public async prepareBulkOperation(operation: BatchOperation) {
		this.acceptText = orderBatchOperationTitleMap[operation];
		this.whatsappButtonVisible = false;
		this.loading = false;
		this.accepted = false;
		this.orderSetCurrentOperation = operation;
		this.active = true;
	}

	public async generateOrderSet() {
		this.actionText = 'Generando listado...';
		this.accepted = true;
		this.loading = true;
		this.active = true;
		const promise = OrderSetApiGateway.createOrderSet(this.orderListState.getSelectedOrdersIds());
		const { id } = await getGlobalProfiler().measure(promise);
		await goto(resolve('/(app)/(main)/order-sets/[id]/print', { id }));
	}

	public async acceptBulkOperation() {
		if (this.orderSetCurrentOperation == null) {
			return;
		}
		this.accepted = true;
		await this.runBulkOperation();
	}

	public isBulkOperationAccepted(): boolean {
		return this.accepted;
	}

	public getBulkOperationAcceptText(): string {
		return this.acceptText;
	}

	public isBulkOperationLoading(): boolean {
		return this.loading;
	}

	public getBulkOperationActionText(): string {
		return this.actionText;
	}

	public isWhatsappButtonVisible(): boolean {
		return this.whatsappButtonVisible;
	}

	public isBulkOrderActive(): boolean {
		return this.active;
	}

	public setBulkOrderInactive(newOpen: boolean): void {
		if (newOpen) {
			return;
		}
		this.active = false;
		this.acceptText = '';
		this.actionText = '';
		this.whatsappButtonVisible = false;
		this.loading = false;
		this.accepted = false;
		this.orderSetCurrentOperation = undefined;
	}

	private async runBulkOperation() {
		if (this.orderSetCurrentOperation == null) {
			return;
		}
		this.actionText = orderBatchOperationActionMap[this.orderSetCurrentOperation];
		this.whatsappButtonVisible = false;
		this.loading = true;
		this.active = true;
		const promise = OrderApiGateway.patchOrders(this.orderListState.getSelectedOrdersIds(), [
			this.orderSetCurrentOperation
		]);
		await getGlobalProfiler().measure(promise);
		this.orderListState.runBulkOperation(this.orderSetCurrentOperation);
		this.loading = false;
		if (this.orderSetCurrentOperation === BatchOperation.NOTIFY_ORDERS) {
			this.whatsappButtonVisible = true;
		}
	}
}
