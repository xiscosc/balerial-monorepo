<script lang="ts">
	import { onMount } from 'svelte';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import { DateTime } from 'luxon';
	import { otherForPrintPricingTypes } from '@/shared/mappings/pricing.mapping';
	import {
		DimensionsType,
		PricingType,
		type ExternalFullOrder
	} from '@marcsimolduressonsardina/core/type';
	import { weekDayMap } from '@/shared/mappings/order.mapping';

	let { fullOrder, print = false }: { fullOrder: ExternalFullOrder; print?: boolean } = $props();

	const order = fullOrder.order;
	const calculatedItem = fullOrder.calculatedItem;
	const totals = fullOrder.totals;

	const others = [
		...otherForPrintPricingTypes
			.map((t) =>
				OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, t)
			)
			.flat(),
		...OrderRepresentationUtilities.getExtras(calculatedItem)
	];

	const enWeekDay = DateTime.fromJSDate(order.item.deliveryDate).weekdayShort as string;
	const esWeekDay = weekDayMap[enWeekDay] ?? enWeekDay;
	const discount =
		calculatedItem.discount > 0
			? `(${OrderRepresentationUtilities.getDiscountRepresentation(calculatedItem.discount)})`
			: '';

	onMount(() => {
		if (print) {
			setTimeout(() => {
				window.print();
			}, 750);
		}
	});
</script>

<main
	class="mx-auto max-w-full font-['Google_Sans_Code',_monospace] print:w-full print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]"
>
	<!-- Header: Title -->
	<div class="border-l border-r border-t border-black">
		<div class="p-0.5 text-center text-[10px]">
			<span class="text-md font-bold">PEDIDO EXTERNO {order.publicId}</span>
		</div>
	</div>

	<!-- Dependiente, Fecha, Hora -->
	<div class="border-l border-r border-black">
		<div class="flex flex-row border-t border-black text-[10px]">
			<!-- Column 1: Dependiente -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Dependiente
				</div>
				<div class="p-0.5">
					{order.user.name.split(' ')[0]}
				</div>
			</div>
			<!-- Column 2: Fecha -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Fecha
				</div>
				<div class="p-0.5">
					{DateTime.fromJSDate(order.createdAt).toFormat('dd/MM/yyyy')}
				</div>
			</div>
			<!-- Column 3: Hora -->
			<div class="flex-auto text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Hora
				</div>
				<div class="p-0.5">
					{DateTime.fromJSDate(order.createdAt).toFormat('HH:mm')}
				</div>
			</div>
		</div>
	</div>

	<!-- Moldura, Cristal, Trasera, PP -->
	<div class="border-l border-r border-black">
		<div class="flex flex-row border-t border-black text-[10px]">
			<!-- Column 1: Moldura -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Moldura
				</div>
				<div class="p-0.5">
					{#each OrderRepresentationUtilities.getOrderMolds(order) as mold (mold)}
						{mold}<br />
					{/each}
					{#if order.item.floatingDistance > 0}
						{`Dist flot: ${order.item.floatingDistance}cm`}
					{/if}
				</div>
			</div>
			<!-- Column 2: Cristal -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Cristal
				</div>
				<div class="p-0.5">
					{#each OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.GLASS) as glass (glass)}
						{glass}<br />
					{/each}
				</div>
			</div>
			<!-- Column 3: Trasera -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Trasera
				</div>
				<div class="p-0.5">
					{#each OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.BACK) as back (back)}
						{back}<br />
					{/each}
				</div>
			</div>
			<!-- Column 4: PP / Fondo -->
			<div class="flex-auto text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					PP / Fondo
				</div>
				<div class="p-0.5">
					{#if OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.PP).length > 0}
						{OrderRepresentationUtilities.getOrderElementByPricingType(
							order,
							calculatedItem,
							PricingType.PP
						)[0]}
						{order.item.pp}cm <br />
						{#each OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.PP).slice(1) as pp (pp)}
							{pp}<br />
						{/each}
					{/if}

					{#if order.item.ppDimensions}
						AR: {order.item.ppDimensions.up}, AB: {order.item.ppDimensions.down}, D: {order.item
							.ppDimensions.right}, I: {order.item.ppDimensions.left}
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Medidas trabajo section -->
	<div class="border-l border-r border-black">
		<div class="flex flex-row border-t border-black text-[10px]">
			<!-- Column 1: Medidas trabajo -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Medidas trabajo
				</div>
				<div class="p-0.5">
					{OrderRepresentationUtilities.getWorkingDimensions(order)}
					{#if order.item.dimensionsType === DimensionsType.EXTERIOR}
						<br />
						<strong>
							Medidas ext: {`${order.item.exteriorHeight}x${order.item.exteriorWidth} cm`}
						</strong>
					{/if}
					{#if order.item.dimensionsType === DimensionsType.WINDOW}
						<br />
						<strong> A ventana </strong>
					{/if}
					{#if order.item.dimensionsType === DimensionsType.ROUNDED}
						<br />
						<strong> Redondas </strong>
					{/if}
				</div>
			</div>
			<!-- Column 2: Uds -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Uds
				</div>
				<div class="p-0.5">
					{order.item.quantity}
				</div>
			</div>
			<!-- Column 3: Descripción -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Descripción
				</div>
				<div class="p-0.5">
					{order.item.description}
				</div>
			</div>
			<!-- Column 4: Medidas obra -->
			<div class="flex-auto text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Medidas obra
				</div>
				<div class="p-0.5">
					{`${order.item.height}x${order.item.width} cm`}
				</div>
			</div>
		</div>
	</div>

	{#if others.length > 0}
		<!-- Otros section -->
		<div class="border-l border-r border-black">
			<div
				class="border-b border-t border-black bg-[#ececec] px-0.5 py-0.5 text-center text-[10px] font-bold text-[#393939]"
			>
				Otros
			</div>
			<div class="text-[10px]">
				{#each OrderRepresentationUtilities.groupInPairs(others) as pair (pair)}
					<div class="flex flex-row">
						<div class="flex-auto p-0.5 text-left">
							{OrderRepresentationUtilities.getPrintableListRepresentatiom(pair[0])}
						</div>
						<div class="flex-auto p-0.5 text-left">
							{#if pair[1].length > 0}
								{OrderRepresentationUtilities.getPrintableListRepresentatiom(pair[1])}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if order.item.observations.trim().length > 0 || order.item.predefinedObservations.length > 0}
		<!-- Observaciones section -->
		<div class="border-l border-r border-black">
			<div
				class="border-b border-t border-black bg-[#ececec] px-0.5 py-0.5 text-center text-[10px] font-bold text-[#393939]"
			>
				Observaciones
			</div>
			<div class="text-[10px]">
				{#if order.item.observations.trim().length > 0}
					<div class="p-0.5 text-left">
						{order.item.observations}
					</div>
				{/if}
				<div class="grid grid-cols-2">
					{#each OrderRepresentationUtilities.groupInPairs(order.item.predefinedObservations) as pair (pair)}
						<div class="p-0.5 text-left">
							{OrderRepresentationUtilities.getPrintableListRepresentatiom(pair[0])}
						</div>
						<div class="p-0.5 text-left">
							{OrderRepresentationUtilities.getPrintableListRepresentatiom(pair[1])}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Pricing section -->
	<div class="border-l border-r border-black">
		<div class="flex flex-row border-t border-black text-[10px]">
			<!-- Column 1: Precio ud -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					{discount} Precio ud
				</div>
				<div class="p-0.5">
					{totals.unitPriceWithoutDiscount.toFixed(2)} €
				</div>
			</div>
			<!-- Column 2: Precio dto (conditional) -->
			{#if calculatedItem.discount > 0}
				<div class="flex-auto border-r border-black text-center">
					<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
						Precio dto
					</div>
					<div class="p-0.5">
						{totals.unitPrice.toFixed(2)} €
					</div>
				</div>
			{/if}
			<!-- Column 3: Uds -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Uds
				</div>
				<div class="p-0.5">
					{order.item.quantity}
				</div>
			</div>
			<!-- Column 4: Total -->
			<div class="flex-auto text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Total {order.hasArrow ? '⬇︎' : ''}
				</div>
				<div class="p-0.5">
					{totals.total.toFixed(2)} €
				</div>
			</div>
		</div>
	</div>

	<!-- Recogida/Referencia section -->
	<div class="border-l border-r border-black">
		<div class="flex flex-row border-t border-black text-[10px]">
			<!-- Column 1: Recogida estimada -->
			<div class="flex-auto border-r border-black text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Recogida estimada
				</div>
				<div class="p-0.5">
					{#if order.item.instantDelivery}
						Al momento
					{:else}
						{esWeekDay}
						{DateTime.fromJSDate(order.item.deliveryDate).toFormat('dd/MM/yyyy')}
					{/if}
				</div>
			</div>
			<!-- Column 2: Referencia -->
			<div class="flex-auto text-center">
				<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
					Referencia
				</div>
				<div class="p-0.5">
					{order.reference}
				</div>
			</div>
		</div>
	</div>
	<div class="border-b border-l border-r border-black"></div>
</main>

<style>
	@media print {
		@page {
			size: A5 portrait;
			margin: 0 !important;
		}

		main {
			display: block;
			page-break-after: avoid;
			page-break-inside: avoid;
		}
	}
</style>
