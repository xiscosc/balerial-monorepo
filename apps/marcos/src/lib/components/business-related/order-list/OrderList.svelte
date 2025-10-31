<script lang="ts">
	import { type FullOrder, OrderStatus } from '@marcsimolduressonsardina/core/type';
	import OrderCard from '@/components/business-related/order-list/OrderCard.svelte';
	import Box from '@/components/generic/Box.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Button from '@/components/generic/button/Button.svelte';
	import OrderSkeletonCard from '@/components/business-related/order-detail/OrderSkeletonCard.svelte';
	import { GenericTools } from '@/shared/generic/generic.tools';
	import { ActionBarState } from '@/state/action-bar/action-bar.state.svelte';
	import { onDestroy } from 'svelte';
	import { OrderListState } from '@/components/business-related/order-list/OrderListState.svelte';
	import { OrderListBulkOperationState } from '@/components/business-related/order-list/OrderListBulkOperationState.svelte';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import * as Dialog from '@/components/ui/dialog/index.js';
	import WhatsAppButton from '@/components/business-related/button/WhatsAppButton.svelte';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import { BatchOperation } from '@/type/api.type';
	import Icon from '@/components/generic/icon/Icon.svelte';

	interface Props {
		promiseOrders?: Promise<FullOrder[]>;
		newPromiseOrders?: Promise<FullOrder[]>;
		paginationAvailable?: boolean;
		paginationFunction?: () => void;
		emptyMessage?: 'NOT_FOUND' | 'EMPTY';
		showCustomer?: boolean;
		loadingCount?: number;
	}

	let {
		promiseOrders,
		newPromiseOrders = undefined,
		paginationAvailable = false,
		paginationFunction = () => {},
		showCustomer = true,
		loadingCount = 15,
		emptyMessage = 'NOT_FOUND'
	}: Props = $props();

	const orderListState = new OrderListState();
	const orderListBulkOperationState = new OrderListBulkOperationState(orderListState);

	let loading = $state(false);
	let paginationLoading = $state(false);

	let whatsAppButtonDisabled = $derived(
		!orderListState.getSelectedOrdersAreFinished() ||
			!orderListState.getSelectedOrdersAreFromSameCustomer()
	);

	let whatsAppText = $derived(
		OrderRepresentationUtilities.getWhatsappFinishedText(
			orderListState
				.getSelectedOrders()
				.map((fullOrder) => fullOrder.order)
				.filter((order) => order.status === OrderStatus.FINISHED)
		)
	);

	function handleSelectModeDeactivate() {
		orderListState.setSelectMode(false);
	}

	function handleSelectModeActivation() {
		orderListState.setSelectMode(true);
		ActionBarState.setCloseHandler(handleSelectModeDeactivate);
		ActionBarState.setStartSectionSnippet(actionBarLeft);
		ActionBarState.setCenterSectionSnippet(actionCenter);
		ActionBarState.setActionsSectionSnippet(actionButtons);
		ActionBarState.show();
	}

	function handleSelectAll() {
		orderListState.selectAllOrders();
	}

	function handleSelectOrder(orderId: string, selected: boolean) {
		if (selected) {
			orderListState.selectOrder(orderId);
		} else {
			orderListState.unSelectOrder(orderId);
		}
	}

	$effect(() => {
		if (promiseOrders == null) {
			loading = true;
			return;
		}
		loading = true;
		promiseOrders.then((orders) => {
			orderListState.clearState();
			orderListState.addOrders(orders);
			loading = false;
		});
	});

	$effect(() => {
		if (newPromiseOrders == null) {
			return;
		}
		paginationLoading = true;
		newPromiseOrders.then((orders) => {
			orderListState.addOrders(orders);
			paginationLoading = false;
		});
	});

	onDestroy(() => {
		ActionBarState.destroy();
	});
</script>

{#snippet actionBarLeft()}
	<span class="rounded-lg bg-gray-800 px-3 py-1 text-xs font-semibold text-white">
		{orderListState.getSelectedOrdersCount()}/{orderListState.getOrdersCount()}
	</span>
{/snippet}

{#snippet actionCenter()}
	<span class="text-xs">
		<Button
			onClick={handleSelectAll}
			iconSize={IconSize.SMALL}
			text="Seleccionar todos"
			icon={IconType.ORDER_DEFAULT}
		></Button>
	</span>
{/snippet}

{#snippet actionButtons()}
	{#if orderListState.getSelectedOrdersCount() > 0}
		<div class="flex w-full flex-row gap-2 text-xs">
			<Button
				iconSize={IconSize.SMALL}
				onClick={orderListBulkOperationState.generateOrderSet}
				disabled={!orderListState.getSelectedOrdersAreFromSameCustomer()}
				text=""
				icon={IconType.PRINTER}
				tooltipText="Hay pedidos de diferentes clientes seleccionados"
			></Button>
			{#if !orderListState.getSelectedQuotesExist()}
				{#if !whatsAppButtonDisabled}
					<Button
						iconSize={IconSize.SMALL}
						onClick={() => {
							orderListBulkOperationState.prepareBulkOperation(BatchOperation.NOTIFY_ORDERS);
						}}
						style={ButtonStyle.WHATSAPP}
						text=""
						icon={IconType.WHATSAPP}
					></Button>
				{/if}
				<Button
					iconSize={IconSize.SMALL}
					onClick={() => {
						orderListBulkOperationState.prepareBulkOperation(BatchOperation.SET_PAID);
					}}
					style={ButtonStyle.ORDER_PICKED_UP_VARIANT}
					textType={ButtonText.NO_COLOR}
					text=""
					icon={IconType.COINS}
				></Button>
				{#if orderListState.getSelectedOrdersAreFinished()}
					<Button
						iconSize={IconSize.SMALL}
						style={ButtonStyle.ORDER_PENDING}
						onClick={() => {
							orderListBulkOperationState.prepareBulkOperation(BatchOperation.SET_PICKED_UP);
						}}
						text=""
						icon={IconType.TRUCK}
					></Button>
				{/if}
				<Button
					iconSize={IconSize.SMALL}
					style={ButtonStyle.ORDER_GENERIC_VARIANT}
					onClick={() => {
						orderListBulkOperationState.prepareBulkOperation(BatchOperation.SET_INVOICED);
					}}
					text=""
					textType={ButtonText.NO_COLOR}
					icon={IconType.INVOICED}
				></Button>
			{/if}
		</div>
	{/if}
{/snippet}

{#snippet loadingSkeleton()}
	<div class="flex w-full flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		{#each GenericTools.getIterableNumberList(loadingCount) as i (i)}
			<OrderSkeletonCard></OrderSkeletonCard>
		{/each}
	</div>
{/snippet}

<Dialog.Root
	bind:open={
		orderListBulkOperationState.isBulkOrderActive, orderListBulkOperationState.setBulkOrderInactive
	}
>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Operaciones en lote</Dialog.Title>
			<Dialog.Description>
				{#if !orderListBulkOperationState.isBulkOperationAccepted()}
					<div class="flex flex-col gap-2">
						<p class="text-md">
							¿Estás seguro de que deseas continuar? Esta operación no se puede deshacer
						</p>
						<Button
							text={orderListBulkOperationState.getBulkOperationAcceptText()}
							icon={IconType.DONE}
							onClick={orderListBulkOperationState.acceptBulkOperation}
						></Button>
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						<div
							class="text-md flex flex-row gap-2"
							class:text-green-700={!orderListBulkOperationState.isBulkOperationLoading()}
							class:text-gray-900={orderListBulkOperationState.isBulkOperationLoading()}
						>
							<div class:animate-spin={orderListBulkOperationState.isBulkOperationLoading()}>
								<Icon
									type={orderListBulkOperationState.isBulkOperationLoading()
										? IconType.LOADING_BALL
										: IconType.DONE}
								></Icon>
							</div>
							<span>{orderListBulkOperationState.getBulkOperationActionText()}</span>
						</div>
						{#if orderListBulkOperationState.isWhatsappButtonVisible()}
							<div class="flex">
								<WhatsAppButton
									label="Enviar mensaje todos finalizados"
									message={whatsAppText}
									customer={orderListState.getCustomerFromFirstSelectedOrder()}
								></WhatsAppButton>
							</div>
						{/if}
					</div>
				{/if}
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>

{#if promiseOrders == null}
	{@render loadingSkeleton()}
{:else if loading}
	{@render loadingSkeleton()}
{:else if orderListState.getOrdersCount() === 0 && emptyMessage === 'NOT_FOUND'}
	<Box title="Sin Resultados" icon={IconType.ALERT}>
		<p class="text-md">No se han encontrado pedidos</p>
	</Box>
{:else}
	<div class="flex w-full flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		{#each orderListState.getAllOrders() as fullOrder (fullOrder.order.id)}
			<OrderCard
				{fullOrder}
				{showCustomer}
				isSelectMode={orderListState.isSelectMode()}
				isSelected={orderListState.isOrderSelected(fullOrder.order.id)}
				{handleSelectOrder}
				{handleSelectModeActivation}
			/>
		{/each}
		{#if paginationLoading}
			{#each GenericTools.getIterableNumberList(Math.min(5, loadingCount)) as i (i)}
				<OrderSkeletonCard></OrderSkeletonCard>
			{/each}
		{:else if paginationAvailable}
			<div class="flex h-full md:col-span-2 lg:col-span-3 xl:col-span-5">
				<Button text="Cargar más" icon={IconType.ORDER_DEFAULT} onClick={paginationFunction}
				></Button>
			</div>
		{/if}
	</div>
{/if}
