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
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import * as Dialog from '@/components/ui/dialog/index.js';
	import { OrderSetApiGateway } from '@/gateway/order-set-api.gateway';
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { OrderApiGateway } from '@/gateway/order-api.gateway';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import WhatsAppButton from '@/components/business-related/button/WhatsAppButton.svelte';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import { BatchOperation } from '@/type/api.type';

	interface Props {
		promiseOrders?: Promise<FullOrder[]>;
		newPromiseOrders?: Promise<FullOrder[]>;
		paginationAvailable?: boolean;
		paginationFunction?: () => void;
		emptyMessage?: 'NOT_FOUND' | 'EMPTY';
		showCustomer?: boolean;
		loadingCount?: number;
		selectionModePossible?: boolean;
	}

	let {
		promiseOrders,
		newPromiseOrders = undefined,
		paginationAvailable = false,
		paginationFunction = () => {},
		showCustomer = true,
		loadingCount = 15,
		emptyMessage = 'NOT_FOUND',
		selectionModePossible = true
	}: Props = $props();

	const orderListState = new OrderListState();
	let loading = $state(false);
	let paginationLoading = $state(false);

	let orderSetDialogOpen = $state(false);
	let orderSetDialogTitle = $state('');
	let orderSetDialogLoadingText = $state('');
	let whatsappDialogOpen = $state(false);
	let whatsappLoading = $state(true);
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
		if (!selectionModePossible) {
			return;
		}

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

	async function setOrdersAsPayed() {
		orderSetDialogTitle = 'Marcando pedidos como pagados...';
		orderSetDialogOpen = true;
		const promise = OrderApiGateway.patchOrders(orderListState.getSelectedOrdersIds(), [
			BatchOperation.SET_PAID
		]);
		await getGlobalProfiler().measure(promise);

		orderListState.setSelectedOrdersAsPayed();
		orderSetDialogOpen = false;
	}

	async function setOrdersAsPickedUp() {
		orderSetDialogTitle = 'Marcando pedidos como recogidos...';
		orderSetDialogOpen = true;
		const promise = OrderApiGateway.patchOrders(orderListState.getSelectedOrdersIds(), [
			BatchOperation.SET_PICKED_UP
		]);
		await getGlobalProfiler().measure(promise);

		orderListState.setSelectedOrdersAsPickedUp();
		orderSetDialogOpen = false;
	}

	async function setOrdersAsInvoiced() {
		orderSetDialogTitle = 'Marcando pedidos como facturados...';
		orderSetDialogOpen = true;
		const promise = OrderApiGateway.patchOrders(orderListState.getSelectedOrdersIds(), [
			BatchOperation.SET_INVOICED
		]);
		await getGlobalProfiler().measure(promise);

		orderSetDialogOpen = false;
	}

	async function generateOrderSet() {
		orderSetDialogTitle = 'Generando listado...';
		orderSetDialogOpen = true;
		const promise = OrderSetApiGateway.createOrderSet(orderListState.getSelectedOrdersIds());
		const { id } = await getGlobalProfiler().measure(promise);
		await goto(resolve('/(app)/(main)/order-sets/[id]/print', { id }));
	}

	async function notifyWhatsapp() {
		whatsappLoading = true;
		whatsappDialogOpen = true;
		if (orderListState.getSelectedOrdersIds().length === 0) {
			whatsappLoading = false;
			whatsappDialogOpen = false;
			return;
		}

		const promise = OrderApiGateway.patchOrders(orderListState.getSelectedOrdersIds(), [
			BatchOperation.NOTIFY_ORDERS
		]);
		await getGlobalProfiler().measure(promise);

		orderListState.setSelectedOrdersAsNotified();
		whatsappLoading = false;
	}
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
			<Button iconSize={IconSize.SMALL} onClick={generateOrderSet} text="" icon={IconType.PRINTER}
			></Button>
			<Button
				iconSize={IconSize.SMALL}
				disabled={!orderListState.getAllOrdersAreFinished()}
				onClick={notifyWhatsapp}
				tooltipText="Hay pedidos no finalizados seleccionados"
				style={ButtonStyle.WHATSAPP}
				text=""
				icon={IconType.WHATSAPP}
			></Button>
			<Button
				iconSize={IconSize.SMALL}
				onClick={setOrdersAsPayed}
				style={ButtonStyle.ORDER_PICKED_UP_VARIANT}
				textType={ButtonText.NO_COLOR}
				text=""
				icon={IconType.COINS}
			></Button>
			<Button
				iconSize={IconSize.SMALL}
				style={ButtonStyle.ORDER_PENDING}
				onClick={setOrdersAsPickedUp}
				disabled={!orderListState.getAllOrdersAreFinished()}
				text=""
                tooltipText="Hay pedidos no finalizados seleccionados"
				icon={IconType.TRUCK}
			></Button>
			<Button
				iconSize={IconSize.SMALL}
				style={ButtonStyle.ORDER_GENERIC_VARIANT}
				onClick={setOrdersAsInvoiced}
				text=""
				textType={ButtonText.NO_COLOR}
				icon={IconType.INVOICED}
			></Button>
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

<Dialog.Root bind:open={orderSetDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{orderSetDialogTitle}</Dialog.Title>
			<Dialog.Description>
				<span class="pt-4 text-xs">
					<ProgressBar text={orderSetDialogLoadingText}></ProgressBar>
				</span>
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={whatsappDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Notificando clientes</Dialog.Title>
			<Dialog.Description>
				<span class="pt-4 text-xs">
					{#if whatsappLoading}
						<ProgressBar text=""></ProgressBar>
					{:else}
						<div class="flex">
							<WhatsAppButton
								label="Enviar mensaje todos finalizados"
								message={whatsAppText}
								customer={orderListState.getCustomerFromFirstSelectedOrder()}
							></WhatsAppButton>
						</div>
					{/if}
				</span>
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
