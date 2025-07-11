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

<main>
	<table>
		<tbody>
			<tr>
				<td class="inner-td">
					<table class="inner-table">
						<tbody>
							<tr>
								<td>
									<h4>PEDIDO EXTERNO {order.publicId}</h4>
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
									{#each OrderRepresentationUtilities.getOrderMolds(order) as mold (mold)}
										{mold}<br />
									{/each}
									{#if order.item.floatingDistance > 0}
										{`Dist flot: ${order.item.floatingDistance}cm`}
									{/if}
								</td>
								<td>
									{#each OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.GLASS) as glass (glass)}
										{glass}<br />
									{/each}
								</td>
								<td>
									{#each OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.BACK) as back (back)}
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
										{#each OrderRepresentationUtilities.getOrderElementByPricingType(order, calculatedItem, PricingType.PP).slice(1) as pp (pp)}
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
								{#each OrderRepresentationUtilities.groupInPairs(others) as pair (pair)}
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
								{#each OrderRepresentationUtilities.groupInPairs(order.item.predefinedObservations) as pair (pair)}
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
								<th> Recogida estimada </th>
								<th> Referencia </th>
							</tr>
							<tr class="last-row">
								<td>
									{#if order.item.instantDelivery}
										Al momento
									{:else}
										{esWeekDay}
										{DateTime.fromJSDate(order.item.deliveryDate).toFormat('dd/MM/yyyy')}
									{/if}
								</td>
								<td> {order.reference} </td>
							</tr>
						</tbody>
					</table>
				</td>
			</tr>
		</tbody>
	</table>
	<div class="customer-text"></div>
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

	.last-row {
		border-bottom: 1px solid black;
	}

	table {
		font-family: monospace;
		border-collapse: collapse;
		margin: 0 auto;
	}
</style>
