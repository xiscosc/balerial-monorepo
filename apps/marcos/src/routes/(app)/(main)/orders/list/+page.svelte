<script lang="ts">
	import type { PageData } from './$types';
	import Box from '@/components/generic/Box.svelte';
	import { OrderStatus } from '@marcsimolduressonsardina/core/type';
	import FilterButton from '@/components/generic/button/FilterButton.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import * as NativeSelect from '@/components/ui/native-select/index.js';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { page } from '$app/state';
	import { getStatusUIInfo } from '@/ui/ui.helper';
	import OrderList from '@/components/business-related/order-list/OrderList.svelte';
	import { ListStateClass, type OrderListSort } from './List.state.svelte';
	import { untrack } from 'svelte';

	const initialStatus = page.url.searchParams.get('status') as OrderStatus;
	let { data }: { data: PageData } = $props();
	let searchValue = $state('');
	const listState = new ListStateClass(
		initialStatus,
		untrack(() => data.priceManager)
	);

	function statusScrollHint(node: HTMLDivElement): void | (() => void) {
		const isMobile = window.matchMedia('(max-width: 767px)').matches;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!isMobile || reduceMotion) return;

		let returnTimer: number | undefined;
		const startTimer = window.setTimeout(() => {
			if (node.scrollWidth <= node.clientWidth || node.scrollLeft !== 0) return;

			const distance = Math.min(40, node.scrollWidth - node.clientWidth);
			node.scrollTo({ left: distance, behavior: 'smooth' });
			returnTimer = window.setTimeout(() => {
				node.scrollTo({ left: 0, behavior: 'smooth' });
			}, 450);
		}, 400);

		const stopHint = () => {
			window.clearTimeout(startTimer);
			window.clearTimeout(returnTimer);
		};

		node.addEventListener('pointerdown', stopHint, { once: true });

		return () => {
			stopHint();
			node.removeEventListener('pointerdown', stopHint);
		};
	}
</script>

{#snippet statusButton(status: OrderStatus, label: string)}
	{@const active = listState.getStatus() === status}
	{@const statusUI = getStatusUIInfo(status)}
	<FilterButton
		disabled={listState.getIsLoading()}
		onclick={() => listState.setFilter(status)}
		icon={statusUI.statusIcon}
		color={statusUI.bannerColor}
		selected={active}
	>
		{label}
	</FilterButton>
{/snippet}

{#snippet unlinkedButton()}
	<FilterButton
		disabled={listState.getIsLoading()}
		onclick={() => listState.setFilter(listState.getStatus(), !listState.getUnlinkedOnly())}
		icon={IconType.USER_PLUS}
		color="red"
		selected={listState.getUnlinkedOnly()}
		selectedTint
	>
		Sin vincular
	</FilterButton>
{/snippet}

{#snippet searchInput()}
	<div class="relative">
		<div class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">
			<Icon type={IconType.SEARCH} />
		</div>
		<Input
			bind:value={searchValue}
			type="text"
			class="pl-10"
			placeholder="Buscar en descripción..."
			onkeyup={() => listState.inputSearchValue(searchValue)}
		></Input>
	</div>
{/snippet}

{#snippet sortSelect()}
	<div class="relative">
		<div class="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-gray-500">
			<Icon type={IconType.SORT} />
		</div>
		<NativeSelect.Root
			value={listState.getSort()}
			disabled={listState.getIsLoading()}
			aria-label="Ordenar pedidos"
			class="h-10 pl-10"
			onchange={(event) => listState.setSort(event.currentTarget.value as OrderListSort)}
		>
			<option value="newest">Recientes</option>
			<option value="oldest">Antiguos</option>
		</NativeSelect.Root>
	</div>
{/snippet}

<div class="space flex w-full flex-col gap-4">
	<SimpleHeading icon={IconType.ORDER_DEFAULT}>{listState.getListTitle()}</SimpleHeading>
	<Box>
		<div class="flex flex-col gap-3">
			<div
				{@attach statusScrollHint}
				class="-mx-1 flex [scrollbar-width:none] gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:gap-2 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
			>
				{@render statusButton(OrderStatus.PENDING, 'Pendientes')}
				{@render statusButton(OrderStatus.FINISHED, 'Finalizados')}
				{@render statusButton(OrderStatus.PICKED_UP, 'Recogidos')}
				{@render statusButton(OrderStatus.QUOTE, 'Presupuestos')}

				{#if [OrderStatus.PENDING, OrderStatus.QUOTE].includes(listState.getStatus())}
					<div class="ml-2 hidden md:block">
						{@render unlinkedButton()}
					</div>
				{/if}
			</div>

			<div class="hidden items-center gap-3 md:flex">
				<div class="min-w-0 flex-1">
					{@render searchInput()}
				</div>
				<div class="w-44 shrink-0">
					{@render sortSelect()}
				</div>
			</div>

			<div class="flex flex-col gap-3 md:hidden">
				{@render searchInput()}
				<div class="flex items-center gap-2">
					{#if [OrderStatus.PENDING, OrderStatus.QUOTE].includes(listState.getStatus())}
						{@render unlinkedButton()}
					{/if}
					<div class="min-w-0 flex-1">
						{@render sortSelect()}
					</div>
				</div>
			</div>
		</div>
	</Box>

	{#if listState.getShowMinCharsAlert()}
		<div class="w-full text-center">Escribe más de 3 carácteres</div>
	{:else}
		<OrderList
			promiseOrders={listState.getOrders()}
			newPromiseOrders={listState.getPaginatedOrders()}
			emptyMessage={listState.getIsSearchMode() ? 'NOT_FOUND' : 'EMPTY'}
			paginationAvailable={listState.getPaginationAvailable()}
			paginationFunction={() => listState.triggerPagination()}
		/>
	{/if}
</div>
