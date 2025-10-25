<script lang="ts">
	import { type FullOrder } from '@marcsimolduressonsardina/core/type';
	import OrderCard from '@/components/business-related/order-list/OrderCard.svelte';
	import Box from '@/components/generic/Box.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Button from '@/components/generic/button/Button.svelte';
	import OrderSkeletonCard from '@/components/business-related/order-detail/OrderSkeletonCard.svelte';
	import { GenericTools } from '@/shared/generic/generic.tools';
	import { ActionBarState } from '@/state/action-bar/action-bar.state.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { OrderListState } from '@/components/business-related/order-list/OrderListState.svelte';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';

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
	let loading = $state(false);
	let paginationLoading = $state(false);

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
	<div class="flex w-full flex-row gap-2 text-xs">
		<Button iconSize={IconSize.SMALL} text="" icon={IconType.PRINTER}></Button>
		<Button iconSize={IconSize.SMALL} style={ButtonStyle.WHATSAPP} text="" icon={IconType.WHATSAPP}
		></Button>
		<Button
			iconSize={IconSize.SMALL}
			style={ButtonStyle.ORDER_PICKED_UP_VARIANT}
			textType={ButtonText.NO_COLOR}
			text=""
			icon={IconType.COINS}
		></Button>
		<Button
			iconSize={IconSize.SMALL}
			style={ButtonStyle.ORDER_PENDING}
			text=""
			icon={IconType.TRUCK}
		></Button>
		<Button
			iconSize={IconSize.SMALL}
			style={ButtonStyle.ORDER_GENERIC_VARIANT}
			text=""
			textType={ButtonText.NO_COLOR}
			icon={IconType.INVOICED}
		></Button>
	</div>
{/snippet}

{#snippet loadingSkeleton()}
	<div class="flex w-full flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		{#each GenericTools.getIterableNumberList(loadingCount) as i (i)}
			<OrderSkeletonCard></OrderSkeletonCard>
		{/each}
	</div>
{/snippet}

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
