<script lang="ts">
	import { type FullOrder, OrderStatus } from '@marcsimolduressonsardina/core/type';
	import OrderCard from '@/components/business-related/order-list/OrderCard.svelte';
	import Box from '@/components/generic/Box.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import OrderSkeletonCard from '@/components/business-related/order-detail/OrderSkeletonCard.svelte';
	import { GenericTools } from '@/shared/generic/generic.tools';
	import { ActionBarState } from '@/state/action-bar/action-bar.state.svelte';
	import { onDestroy } from 'svelte';
	import { OrderListState } from '@/components/business-related/order-list/OrderListState.svelte';
	import { OrderListBulkOperationState } from '@/components/business-related/order-list/OrderListBulkOperationState.svelte';
	import {
		ButtonVariant,
		ButtonTextVariant,
		ButtonSize
	} from '@/components/generic/button/button.enum';
	import * as Dialog from '@/components/ui/dialog/index.js';
	import WhatsAppButton from '@/components/business-related/button/WhatsAppButton.svelte';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import { BatchOperation } from '@/type/api.type';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import TooltipButtonWrapper from '@/components/generic/button/TooltipButtonWrapper.svelte';

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
	<MarcosButton
		onclick={handleSelectAll}
		iconSize={IconSize.SMALL}
		size={ButtonSize.SMALL}
		icon={IconType.ORDER_DEFAULT}
	>
		Seleccionar todos
	</MarcosButton>
{/snippet}

{#snippet actionButtons()}
	{#if orderListState.getSelectedOrdersCount() > 0}
		<div class="flex w-full flex-row gap-2 text-xs">
			<TooltipButtonWrapper
				text="Hay pedidos de diferentes clientes seleccionados"
				enabled={!orderListState.getSelectedOrdersAreFromSameCustomer()}
			>
				<MarcosButton
					disabled={!orderListState.getSelectedOrdersAreFromSameCustomer()}
					onclick={orderListBulkOperationState.generateOrderSet}
					iconSize={IconSize.SMALL}
					size={ButtonSize.SMALL}
					icon={IconType.PRINTER}
				></MarcosButton>
			</TooltipButtonWrapper>

			{#if !orderListState.getSelectedQuotesExist()}
				{#if !whatsAppButtonDisabled}
					<MarcosButton
						size={ButtonSize.SMALL}
						iconSize={IconSize.SMALL}
						onclick={() => {
							orderListBulkOperationState.prepareBulkOperation(BatchOperation.NOTIFY_ORDERS);
						}}
						variant={ButtonVariant.WHATSAPP}
						icon={IconType.WHATSAPP}
					></MarcosButton>
				{/if}
				<MarcosButton
					size={ButtonSize.SMALL}
					iconSize={IconSize.SMALL}
					onclick={() => {
						orderListBulkOperationState.prepareBulkOperation(BatchOperation.SET_PAID);
					}}
					variant={ButtonVariant.ORDER_PICKED_UP_VARIANT}
					textVariant={ButtonTextVariant.NO_COLOR}
					icon={IconType.COINS}
				></MarcosButton>
				{#if orderListState.getSelectedOrdersAreFinished()}
					<MarcosButton
						size={ButtonSize.SMALL}
						iconSize={IconSize.SMALL}
						variant={ButtonVariant.ORDER_PENDING}
						onclick={() => {
							orderListBulkOperationState.prepareBulkOperation(BatchOperation.SET_PICKED_UP);
						}}
						icon={IconType.TRUCK}
					></MarcosButton>
				{/if}
				<MarcosButton
					size={ButtonSize.SMALL}
					iconSize={IconSize.SMALL}
					variant={ButtonVariant.ORDER_GENERIC_VARIANT}
					onclick={() => {
						orderListBulkOperationState.prepareBulkOperation(BatchOperation.SET_INVOICED);
					}}
					textVariant={ButtonTextVariant.NO_COLOR}
					icon={IconType.INVOICED}
				></MarcosButton>
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
						<MarcosButton
							icon={IconType.DONE}
							onclick={orderListBulkOperationState.acceptBulkOperation}
						>
							{orderListBulkOperationState.getBulkOperationAcceptText()}
						</MarcosButton>
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
				<MarcosButton icon={IconType.ORDER_DEFAULT} onclick={paginationFunction}>
					Cargar más
				</MarcosButton>
			</div>
		{/if}
	</div>
{/if}
