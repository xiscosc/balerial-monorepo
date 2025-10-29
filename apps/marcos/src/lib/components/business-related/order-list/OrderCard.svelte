<script lang="ts">
	import { DateTime } from 'luxon';
	import { watch } from 'runed';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import { orderStatusMap } from '@/shared/mappings/order.mapping';
	import { getStatusUIInfo, getStatusUIInfoWithPaymentInfo } from '@/ui/ui.helper';
	import { OrderUtilities as CoreOrderUtilities } from '@marcsimolduressonsardina/core/util';
	import Button from '@/components/generic/button/Button.svelte';
	import { ButtonStyle } from '@/components/generic/button/button.enum';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { OrderStatus, type FullOrder } from '@marcsimolduressonsardina/core/type';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import { fade } from 'svelte/transition';

	interface Props {
		fullOrder: FullOrder;
		showCustomer?: boolean;
		isSelectMode?: boolean;
		isSelected?: boolean;
		handleSelectModeActivation: () => void;
		handleSelectOrder: (orderId: string, selected: boolean) => void;
	}

	let {
		fullOrder,
		showCustomer = true,
		isSelectMode = false,
		isSelected = false,
		handleSelectModeActivation,
		handleSelectOrder
	}: Props = $props();
	let order = $derived(fullOrder.order);
	const calculatedItem = fullOrder.calculatedItem;
	let internalSelected = $state(false);
	let measures = $derived(`${order.item.height}x${order.item.width} cm`);
	let mold = $derived(
		OrderRepresentationUtilities.getFirstMoldDescriptionFromOrder(order, calculatedItem)
	);

	function handlePublicIdClick() {
		handleSelectModeActivation();
		internalSelected = true;
	}
	watch(
		() => internalSelected,
		() => {
			if (isSelectMode) {
				handleSelectOrder(order.id, internalSelected);
			}
		}
	);

	watch(
		() => isSelected,
		() => {
			if (isSelectMode) {
				internalSelected = isSelected;
			}
		}
	);

	watch(
		() => isSelectMode,
		() => {
			if (!isSelectMode) {
				internalSelected = false;
			}
		}
	);
</script>

{#snippet infoPiece(icon: IconType, title: string, value: string, redText: boolean = false)}
	<div class="flex flex-col">
		<div class="flex items-center gap-2 text-gray-600">
			<Icon type={icon} />
			<span>{title}</span>
		</div>
		<div class="font-semibold" class:text-red-600={redText}>
			{value}
		</div>
	</div>
{/snippet}

<div
	class="mx-auto flex w-full flex-col overflow-hidden rounded-md border border-gray-300 md:max-w-md"
>
	<div
		class={`rounded-t-md p-2 text-white ${
			getStatusUIInfoWithPaymentInfo(order.status, fullOrder.totals.payed).staticColor
		}`}
	>
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2 space-x-1 rounded-lg px-3 py-1 pr-2 text-sm">
				<Icon type={getStatusUIInfo(order.status).statusIcon} />
				<span class="font-semibold">{orderStatusMap[order.status]}</span>
			</div>

			{#if !isSelectMode}
				<div
					onclick={handlePublicIdClick}
					class="overflow-hidden text-[0.6rem] text-ellipsis whitespace-nowrap select-none"
					id="order-public-id"
					in:fade={{ duration: 200 }}
					out:fade={{ duration: 150 }}
				>
					<span class="rounded-lg bg-white px-2 py-1 font-mono text-gray-800">
						{order.publicId}
					</span>
				</div>
			{:else}
				<div in:fade={{ duration: 200 }} out:fade={{ duration: 150 }}>
					<Checkbox
						checked={isSelected}
						onCheckedChange={(checked: boolean) => {
							internalSelected = checked;
						}}
					/>
				</div>
			{/if}
		</div>
	</div>

	<div class="flex flex-1 flex-col bg-white p-1 text-sm">
		<div class="grid flex-1 auto-rows-max grid-cols-2 items-start gap-2 p-3">
			{@render infoPiece(
				IconType.CLOCK,
				'Fecha',
				DateTime.fromJSDate(order.createdAt).toFormat('dd/MM/yyyy HH:mm')
			)}

			{#if showCustomer && !CoreOrderUtilities.isOrderTemp(order)}
				{@render infoPiece(IconType.USER, 'Cliente', order.customer.name)}
			{/if}

			{#if CoreOrderUtilities.isOrderTemp(order)}
				{@render infoPiece(
					IconType.USER,
					'Cliente',
					order.status === OrderStatus.QUOTE ? 'Presupuesto sin vincular' : 'Pedido sin vincular',
					true
				)}
			{/if}

			{#if order.status !== OrderStatus.QUOTE}
				{@render infoPiece(
					IconType.TRUCK,
					'Recogida',
					order.item.instantDelivery
						? 'Al momento'
						: DateTime.fromJSDate(order.item.deliveryDate).toFormat('dd/MM/yyyy')
				)}
			{/if}

			{#if order.status !== OrderStatus.QUOTE}
				{@render infoPiece(IconType.COINS, 'Pagado', fullOrder.totals.payed ? 'Sí' : 'No')}
			{/if}

			{#if order.status === OrderStatus.FINISHED}
				{@render infoPiece(IconType.LOCATION, 'Ubicación', order.location)}
			{/if}

			{@render infoPiece(IconType.RULER, 'Medidas', measures)}

			{#if mold}
				{@render infoPiece(IconType.MOLD, 'Moldura', mold)}
			{/if}
		</div>

		<div class="text-1 m-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-2">
			{order.item.description}
		</div>
	</div>

	<!-- Footer Section -->
	<div class="flex items-center justify-between bg-white p-3">
		<div class="flex flex-row gap-1">
			{#if fullOrder.order.status === OrderStatus.FINISHED && fullOrder.order.notified}
				<div
					class="flex items-center rounded-md border border-emerald-500 bg-emerald-100 px-0.5 py-0.5 text-emerald-800"
				>
					<div class="flex items-center p-1">
						<Icon type={IconType.SENT} size={IconSize.SMALL} />
					</div>
				</div>
			{/if}

			{#if fullOrder.order.invoiced}
				<div
					class="flex items-center rounded-md border border-amber-500 bg-amber-100 px-0.5 py-0.5 text-amber-800"
				>
					<div class="flex items-center p-1">
						<Icon type={IconType.INVOICED} size={IconSize.SMALL} />
					</div>
				</div>
			{/if}

			{#if CoreOrderUtilities.isOrderTemp(order)}
				<div
					class="flex items-center gap-2 rounded-md border border-red-400 bg-red-50 px-0.5 py-0.5 text-red-700"
				>
					<div class="flex items-center p-1">
						<Icon type={IconType.USER_PLUS} size={IconSize.SMALL} />
					</div>
				</div>
			{/if}
		</div>
		<div class="flex flex-row justify-end gap-1 text-xs">
			{#if !CoreOrderUtilities.isOrderTemp(order)}
				<Button
					icon={IconType.PRINTER}
					text="Imprimir"
					link={`/orders/${order.id}/print`}
					style={ButtonStyle.NEUTRAL}
				></Button>
			{/if}
			<Button
				icon={CoreOrderUtilities.isOrderTemp(order) ? IconType.LINK : IconType.EYE}
				text={CoreOrderUtilities.isOrderTemp(order) ? `Vincular` : `Ver`}
				link={`/orders/${order.id}`}
				style={ButtonStyle.CUSTOMER}
			></Button>
		</div>
	</div>
</div>
