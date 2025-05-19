<script lang="ts">
	import { onMount } from 'svelte';
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
		internal = true
	}: { fullOrder: FullOrder; print?: boolean; internal?: boolean } = $props();

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

<main>
	<table>
		<tbody>
			<tr>
				<td class="inner-td">
					<table class="inner-table">
						<tbody>
							<tr>
								<td>
									<div class="qr-container">
										<Qr
											size={94}
											qrData={QrUtilities.generateQrString({
												orderId: order.id,
												origin: internal ? QrOrigin.INTERNAL : QrOrigin.CUSTOMER
											})}
										></Qr>
										<div class="id-text">
											<p class="customer-bottom">{order.publicId}</p>
										</div>
									</div></td
								>
								<td>
									<img
										class="logo"
										src="https://marcsimoldures.com/wp-content/uploads/2017/02/MMlogo111.png"
										alt="logo"
									/>
									<div class="customer-text">
										<p class="customer-bottom">
											Polígono de Son Rossinyol - Gremi Hortolans 19 - 971666920
										</p>
										<p class="customer-bottom">www.marcsimoldures.com - mmss@marcsimoldures.com</p>
										<p class="customer-bottom">Horario de lunes a viernes de 09:00 a 18:00,</p>
										<p class="customer-bottom">sábados de 09:30 a 13:15</p>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>

			<tr>
				<td class="inner-td">
					<table class="inner-table">
						<tbody>
							<tr>
								<th>Dependiente</th>
								<th>Fecha</th>
								<th>Hora</th>
							</tr>
							<tr>
								<td>{order.user.name.split(' ')[0]}</td>
								<td>
									{DateTime.fromJSDate(order.createdAt).toFormat('dd/MM/yyyy')}
								</td>
								<td>{DateTime.fromJSDate(order.createdAt).toFormat('HH:mm')}</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>

			<tr>
				<td class="inner-td">
					<table class="inner-table">
						<tbody>
							<tr>
								<th>Moldura</th>
								<th>Cristal</th>
								<th>Trasera</th>
								<th>PP / Fondo</th>
							</tr>
							<tr>
								<td>
									{#each OrderRepresentationUtilities.getOrderMolds(order) as mold}
										{mold}<br />
									{/each}
									{#if order.item.floatingDistance > 0}
										{`Dist flot: ${order.item.floatingDistance}cm`}
									{/if}
								</td>
								<td>
									{#each OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.GLASS) as glass}
										{glass}<br />
									{/each}
								</td>
								<td>
									{#each OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.BACK) as back}
										{back}<br />
									{/each}
								</td>
								<td>
									{#if OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.PP).length > 0}
										{OrderRepresentationUtilities.getOrderElementByPricingType(
											order,
											calculatedItem,
											PricingType.PP
										)[0]}
										{order.item.pp}cm <br />
										{#each OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.PP).slice(1) as pp}
											{pp}<br />
										{/each}
									{/if}

									{#if order.item.ppDimensions}
										AR: {order.item.ppDimensions.up}, AB: {order.item.ppDimensions.down}, D: {order
											.item.ppDimensions.right}, I: {order.item.ppDimensions.left}
									{/if}
								</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>

			<tr>
				<td class="inner-td">
					<table class="inner-table">
						<tbody>
							<tr>
								<th>Medidas trabajo</th>
								<th>Uds</th>
								<th>Descripción</th>
								<th>Medidas obra</th>
							</tr>
							<tr>
								<td>
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
								</td>
								<td> {order.item.quantity} </td>
								<td>{order.item.description}</td>
								<td>{`${order.item.height}x${order.item.width} cm`}</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>

			{#if others.length > 0}
				<tr>
					<td class="inner-td">
						<table class="inner-table">
							<tbody>
								<tr>
									<th colspan="2" class="list-th"> Otros </th>
								</tr>
								{#each OrderRepresentationUtilities.groupInPairs(others) as pair}
									<tr>
										<td class="list-td">
											{OrderRepresentationUtilities.getPrintableListRepresentatiom(pair[0])}
										</td>
										<td class="list-td">
											{#if pair[1].length > 0}
												{OrderRepresentationUtilities.getPrintableListRepresentatiom(pair[1])}
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</td>
				</tr>
			{/if}

			{#if order.item.observations.trim().length > 0 || order.item.predefinedObservations.length > 0}
				<tr>
					<td class="inner-td">
						<table class="inner-table">
							<tbody>
								<tr>
									<th colspan="2" class="list-th"> Observaciones </th>
								</tr>
								{#if order.item.observations.trim().length > 0}
									<tr>
										<td colspan="2" class="list-td">
											{order.item.observations}
										</td>
									</tr>
								{/if}
								{#each OrderRepresentationUtilities.groupInPairs(order.item.predefinedObservations) as pair}
									<tr>
										<td class="list-td">
											{OrderRepresentationUtilities.getPrintableListRepresentatiom(pair[0])}
										</td>
										<td class="list-td">
											{OrderRepresentationUtilities.getPrintableListRepresentatiom(pair[1])}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</td>
				</tr>
			{/if}

			<tr>
				<td class="inner-td">
					<table class="inner-table">
						<tbody>
							<tr>
								<th>{discount} Precio ud</th>
								{#if calculatedItem.discount > 0}
									<th>Precio dto</th>
								{/if}
								<th>Uds</th>
								<th>A cuenta</th>
								<th>Total {order.hasArrow ? '⬇︎' : ''}</th>
							</tr>
							<tr>
								<td>
									{totals.unitPriceWithoutDiscount.toFixed(2)} €
								</td>
								{#if calculatedItem.discount > 0}
									<td>{totals.unitPrice.toFixed(2)} €</td>
								{/if}
								<td> {order.item.quantity} </td>
								<td> {order.amountPayed.toFixed(2)} €</td>
								<td>{totals.total.toFixed(2)} €</td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>

			<tr>
				<td class="inner-td">
					<table class="inner-table">
						<tbody>
							<tr>
								{#if !isQuote}
									<th> Recogida </th>
								{/if}
								<th> Cliente </th>
								<th> Teléfono </th>
							</tr>
							<tr>
								{#if !isQuote}
									<td>
										{#if order.item.instantDelivery}
											Al momento
										{:else}
											{esWeekDay}
											{DateTime.fromJSDate(order.item.deliveryDate).toFormat('dd/MM/yyyy')}
										{/if}
									</td>
								{/if}
								<td> {order.customer.name} </td>
								<td> {order.customer.phone} </td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
			{#if statusInfo.length > 0}
				<tr>
					<td class="inner-td">
						<table class="inner-table">
							<tbody>
								<tr>
									<td class="status-info">
										{statusInfo.join(' | ')}
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
	<div class="customer-text">
		{#if !isQuote}
			<p class="customer-bottom">
				Una vez pasados <strong>15 días desde la fecha estipulada de entrega</strong>, la empresa
				<strong>no se hará cargo del material.</strong>
			</p>
			<p class="customer-bottom">
				<strong>Sin el justificante no se hará entrega del material.</strong>
			</p>
		{:else}
			<p class="customer-bottom">
				Este presupuesto tiene una validez de <strong>30 días desde la fecha de emisión</strong>,
				para la aceptación del presupuesto y puesta en marcha del pedido deberá hacer el pago del
				50% del presupuesto.
			</p>
			<p class="customer-bottom">
				<strong>IBAN ES13 2100 6805 9102 0013 3197 / SWIFT CAIXESBBXXX</strong>
			</p>
		{/if}
	</div>
</main>

<style>
	@media print {
		table {
			width: 100%;
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}

		@page {
			size: A5 portrait;
			margin: 0 !important;
		}

		main {
			-webkit-print-color-adjust: exact;
			print-color-adjust: exact;
		}
	}

	.inner-table {
		width: 100%;
		border-collapse: collapse;
		border: 1px solid black;
		border-bottom: none;
	}

	.inner-td {
		padding: 0;
	}

	.inner-table th {
		background-color: #ececec;
		padding: 2px 3px 2px 3px;
		color: #393939;
		font-size: xx-small;
		border: 1px solid black;
		border-bottom: none;
	}

	.inner-table td {
		padding: 3px;
		text-align: center;
		border: 1px solid black;
		border-bottom: none;
		font-size: x-small;
	}

	.customer-text {
		font-family: sans-serif;
		font-size: x-small;
	}

	.inner-table .list-td {
		border: none;
		text-align: left;
	}

	.inner-table .list-th {
		border: 1px solid black;
	}

	.inner-table .status-info {
		padding: 4px;
		border-bottom: 1px solid black;
	}

	.customer-bottom {
		margin: 0;
		text-align: center;
	}

	.id-text {
		font-size: xx-small;
	}

	.qr-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 1px;
	}

	table {
		font-family: monospace;
		border-collapse: collapse;
		margin: 0 auto;
	}

	.logo {
		height: 55px;
	}

	.status-info {
		font-weight: bold;
	}
</style>
