<script lang="ts">
	import type { PageData } from './$types';
	import Box from '@/components/generic/Box.svelte';
	import { OrderStatus } from '@marcsimolduressonsardina/core/type';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import Input from '@/components/ui/input/input.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { page } from '$app/state';
	import { getStatusUIInfo } from '@/ui/ui.helper';
	import OrderList from '@/components/business-related/order-list/OrderList.svelte';
	import { ListStateClass } from './List.state.svelte';

	const initialStatus = page.url.searchParams.get('status') as OrderStatus;
	let { data }: { data: PageData } = $props();
	let searchValue = $state('');
	const listState = new ListStateClass(initialStatus, data.priceManager);
</script>

<div class="space flex w-full flex-col gap-4">
	<SimpleHeading icon={IconType.ORDER_DEFAULT}>{listState.getListTitle()}</SimpleHeading>
	<Box>
		<div class="flex flex-col gap-3">
			{#if listState.getStatus() !== OrderStatus.QUOTE}
				<div
					class="flex w-full flex-col place-content-center items-center justify-center gap-3 md:grid md:grid-cols-2"
				>
					<MarcosButton
						disabled={listState.getIsLoading()}
						onclick={() => {
							if (listState.getStatus() !== OrderStatus.FINISHED) {
								listState.setStatus(OrderStatus.FINISHED);
							}
						}}
						variant={listState.getStatus() === OrderStatus.FINISHED
							? ButtonStyle.ORDER_FINISHED_VARIANT
							: ButtonStyle.ORDER_FINISHED}
						textVariant={listState.getStatus() === OrderStatus.FINISHED
							? ButtonText.NO_COLOR
							: ButtonText.WHITE}
						icon={getStatusUIInfo(OrderStatus.FINISHED).statusIcon}
					>
						{listState.getStatus() === OrderStatus.FINISHED
							? 'Viendo pedidos finalizados'
							: 'Ver pedidos finalizados'}
					</MarcosButton>

					<MarcosButton
						disabled={listState.getIsLoading()}
						onclick={() => {
							if (listState.getStatus() !== OrderStatus.PENDING) {
								listState.setStatus(OrderStatus.PENDING);
							}
						}}
						variant={listState.getStatus() === OrderStatus.PENDING
							? ButtonStyle.ORDER_PENDING_VARIANT
							: ButtonStyle.ORDER_PENDING}
						textVariant={listState.getStatus() === OrderStatus.PENDING
							? ButtonText.NO_COLOR
							: ButtonText.WHITE}
						icon={getStatusUIInfo(OrderStatus.PENDING).statusIcon}
					>
						{listState.getStatus() === OrderStatus.PENDING
							? 'Viendo pedidos pendientes'
							: 'Ver pedidos pendientes'}
					</MarcosButton>
				</div>
			{/if}

			<div>
				<Input
					bind:value={searchValue}
					type="text"
					placeholder="Buscar en descripción..."
					onkeyup={() => listState.inputSearchValue(searchValue)}
				></Input>
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
