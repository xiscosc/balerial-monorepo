<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { asset } from '$app/paths';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import { DateTime } from 'luxon';
	import { otherForPrintPricingTypes } from '@/shared/mappings/pricing.mapping';
	import {
		DimensionsType,
		OrderStatus,
		PricingType,
		type FullOrder
	} from '@marcsimolduressonsardina/core/type';
	import Qr from '@/components/generic/Qr.svelte';
	import { weekDayMap } from '@/shared/mappings/order.mapping';
	import { QrOrigin } from '@/type/qr.type';
	import { QrUtilities } from '@/shared/order/qr.utilities';

	let {
		fullOrder,
		print = false,
		internal = true,
		buttons
	}: { fullOrder: FullOrder; print?: boolean; internal?: boolean; buttons?: Snippet } = $props();

	const order = fullOrder.order;
	const calculatedItem = fullOrder.calculatedItem;
	const totals = fullOrder.totals;

	const isQuote = order.status === OrderStatus.QUOTE;

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

	const statusInfo: string[] = [];

	if (!isQuote) {
		if (order.status === OrderStatus.PICKED_UP) {
			statusInfo.push('ENTREGADO');
		}
		if (totals.payed) {
			statusInfo.push('PAGADO');
		} else if (order.amountPayed === 0) {
			statusInfo.push('PENDIENTE DE PAGO');
		} else {
			statusInfo.push(`PENDIENTE DE PAGO (${totals.remainingAmount.toFixed(2)} €)`);
		}
	} else {
		statusInfo.push('PRESUPUESTO');
	}

	onMount(() => {
		if (print) {
			setTimeout(() => {
				window.print();
			}, 750);
		}
	});
</script>

<svelte:head>
	<style>
		@media print {
			@page {
				size: A5 portrait;
				margin: 0 !important;
			}
		}
	</style>
</svelte:head>

<main class="flex flex-col gap-2 print:m-0.5 print:block print:gap-0">
	<div
		class="mx-auto flex max-w-full flex-col gap-0 font-mono print:block print:w-full print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]"
		id="order-print"
	>
		<!-- Header: QR + Logo -->
		<div class="border-t border-r border-l border-black">
			<div class="flex flex-row">
				<div
					class="flex grow flex-col items-center justify-center border-r border-black px-1 py-0.5"
				>
					<div class="flex items-center justify-center py-0.5">
						<Qr
							size={109}
							qrData={QrUtilities.generateQrStringForOrder({
								orderId: order.id,
								origin: internal ? QrOrigin.INTERNAL : QrOrigin.CUSTOMER
							})}
						></Qr>
					</div>
					<div class="p-0 text-center text-[8px]">
						{order.publicId}
					</div>
				</div>
				<div class="flex min-w-0 grow-2 flex-col items-center justify-center p-0.5 text-[10px]">
					<img class="h-[55px]" src={asset('/mmlogo.png')} alt="logo" />
					<div class="max-w-full font-sans text-[10px] wrap-break-word whitespace-normal">
						<p class="m-0 text-center wrap-break-word whitespace-normal">
							Polígono de Son Rossinyol - Gremi Hortolans 19 - 971666920
						</p>
						<p class="m-0 text-center wrap-break-word whitespace-normal">
							www.marcsimoldures.com - mmss@marcsimoldures.com
						</p>
						<p class="m-0 text-center wrap-break-word whitespace-normal">
							Horario de lunes a viernes de 09:00 a 18:00,
						</p>
						<p class="m-0 text-center wrap-break-word whitespace-normal">
							sábados de 09:30 a 13:15
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Dependiente, Fecha, Hora -->
		<div class="border-r border-l border-black">
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
		<div class="border-r border-l border-black">
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
		<div class="border-r border-l border-black">
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
			<div class="border-r border-l border-black">
				<div
					class="border-t border-b border-black bg-[#ececec] px-0.5 py-0.5 text-center text-[10px] font-bold text-[#393939]"
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
			<div class="border-r border-l border-black">
				<div
					class="border-t border-b border-black bg-[#ececec] px-0.5 py-0.5 text-center text-[10px] font-bold text-[#393939]"
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
		<div class="border-r border-l border-black">
			<div class="flex flex-row border-t border-black text-[10px]">
				<div class="flex flex-auto flex-col">
					<div class="flex flex-row">
						<!-- Column 1: Precio ud -->
						<div class="flex-auto border-r border-black text-center">
							<div
								class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]"
							>
								{discount} Precio ud
							</div>
							<div class="p-0.5">
								{totals.unitPriceWithoutDiscount.toFixed(2)} €
							</div>
						</div>
						<!-- Column 2: Precio dto (conditional) -->
						{#if calculatedItem.discount > 0}
							<div class="flex-auto border-r border-black text-center">
								<div
									class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]"
								>
									Precio dto
								</div>
								<div class="p-0.5">
									{totals.unitPrice.toFixed(2)} €
								</div>
							</div>
						{/if}
						<!-- Column 3: Uds -->
						<div class="flex-auto border-r border-black text-center">
							<div
								class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]"
							>
								Uds
							</div>
							<div class="p-0.5">
								{order.item.quantity}
							</div>
						</div>
						<!-- Column 4: A cuenta -->
						<div class="flex-auto text-center">
							<div
								class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]"
							>
								A cuenta
							</div>
							<div class="p-0.5">
								{order.amountPayed.toFixed(2)} €
							</div>
						</div>
					</div>
					<div class="flex flex-row border-t border-black">
						<div class="flex-auto border-r border-black text-center">
							<div
								class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]"
							>
								Base
							</div>
							<div class="p-0.5">
								{(totals.total / 1.21).toFixed(2)} €
							</div>
						</div>
						<div class="flex-auto border-r border-black text-center">
							<div
								class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]"
							>
								IVA
							</div>
							<div class="p-0.5">21 %</div>
						</div>
						<div class="flex-auto text-center">
							<div
								class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]"
							>
								Total IVA
							</div>
							<div class="p-0.5">
								{(totals.total - totals.total / 1.21).toFixed(2)} €
							</div>
						</div>
					</div>
				</div>
				<!-- Total column spanning both rows -->
				<div class="flex flex-auto flex-col justify-center border-l border-black text-center">
					<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
						Total {order.hasArrow ? '⬇︎' : ''}
					</div>
					<div class="flex grow items-center justify-center p-0.5 text-[13px]">
						{totals.total.toFixed(2)} €
					</div>
				</div>
			</div>
		</div>

		<!-- Cliente/Teléfono section -->
		<div class="border-r border-l border-black">
			<div class="flex flex-row border-t border-black text-[10px]">
				<!-- Column 1: Recogida estimada (conditional) -->
				{#if !isQuote}
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
				{/if}
				<!-- Column 2: Cliente -->
				<div class="flex-auto border-r border-black text-center">
					<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
						Cliente
					</div>
					<div class="p-0.5">
						{order.customer.name}
					</div>
				</div>
				<!-- Column 3: Teléfono -->
				<div class="flex-auto text-center">
					<div class="border-b border-black bg-[#ececec] px-0.5 py-0.5 font-bold text-[#393939]">
						Teléfono
					</div>
					<div class="p-0.5">
						{order.customer.phone}
					</div>
				</div>
			</div>
		</div>
		{#if statusInfo.length > 0}
			<!-- Status info section -->
			<div class="border-r border-b border-l border-black">
				<div class="border-t border-black p-1 text-center text-[10px] font-bold">
					{statusInfo.join(' | ')}
				</div>
			</div>
		{/if}

		<div class="font-sans text-[10px]">
			{#if !isQuote}
				<p class="m-0 text-center">
					Una vez pasados <strong>15 días desde la fecha estipulada de entrega</strong>, la empresa
					<strong>no se hará cargo del material.</strong>
				</p>
				<p class="m-0 text-center">
					<strong>Sin el justificante no se hará entrega del material.</strong>
				</p>
			{:else}
				<p class="m-0 text-center">
					Este presupuesto tiene una validez de <strong>30 días desde la fecha de emisión</strong>,
					para la aceptación del presupuesto y puesta en marcha del pedido deberá hacer el pago del
					50% del presupuesto.
				</p>
				<p class="m-0 text-center">
					<strong>IBAN ES13 2100 6805 9102 0013 3197 / SWIFT CAIXESBBXXX</strong>
				</p>
			{/if}
		</div>
	</div>
	<div class="flex flex-col gap-2 font-sans lg:flex-row print:hidden">
		{@render buttons?.()}
	</div>
</main>
