<script lang="ts">
	import type { OrderSet } from '@marcsimolduressonsardina/core/type';
	import { QrUtilities } from '@/shared/order/qr.utilities';
	import Qr from '@/components/generic/Qr.svelte';
	import { asset } from '$app/paths';
	import { DateTime } from 'luxon';

	let { orderSet }: { orderSet: OrderSet } = $props();

	let customer = $derived(orderSet.orders[Object.keys(orderSet.orders)[0]]!.order.customer);

	let total = $derived(
		Object.values(orderSet.orders).reduce((acc, fullOrder) => acc + fullOrder.totals.total, 0)
	);

	let base = $derived(total / 1.21);
	let tax = $derived(total - base);
</script>

<div class="flex min-h-screen flex-col gap-4 p-4">
	<div class="flex flex-row justify-between gap-2">
		<div class="flex min-w-1/3 flex-col gap-2">
			<div class="flex h-[109px] items-center justify-center">
				<Qr
					size={109}
					qrData={QrUtilities.generateQrStringForOrderSet({
						orderSetId: orderSet.id
					})}
				></Qr>
			</div>
			<div class="flex flex-col border-1 border-gray-800 text-[10px]">
				<div class="flex flex-row border-b-1 border-b-gray-800 bg-zinc-400 font-bold text-gray-800">
					<span class="w-1/2 border-r-1 border-r-gray-800 px-2 py-1 text-center">FECHA</span>
					<span class="w-1/2 px-2 py-1 text-center">VENDEDOR</span>
				</div>
				<div class="flex flex-row">
					<span class="w-1/2 border-r-1 border-r-gray-800 px-2 py-1 text-center"
						>{DateTime.fromJSDate(orderSet.createdAt).toFormat('dd/MM/yyyy')}</span
					>
					<span class="w-1/2 px-2 py-1 text-center">{orderSet.createdBy.name.split(' ')[0]}</span>
				</div>
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<div class="flex h-[109px] flex-col items-center justify-center p-0.5 text-[9px]">
				<img class="h-[53px]" src={asset('/mmlogo.png')} alt="logo" />
				<div class="font-sans">
					<p class="m-0 text-center">Polígono de Son Rossinyol - Gremi Hortolans 19 - 971666920</p>
					<p class="m-0 text-center">www.marcsimoldures.com - mmss@marcsimoldures.com</p>
					<p class="m-0 text-center">Horario de lunes a viernes de 09:00 a 18:00,</p>
					<p class="m-0 text-center">sábados de 09:30 a 13:15</p>
				</div>
			</div>
			<div class="flex flex-col border-1 border-gray-800 text-[10px]">
				<div
					class="border-b-1 border-b-gray-800 bg-zinc-400 px-2 py-1 text-center font-bold text-gray-800"
				>
					DATOS DEL CLIENTE
				</div>
				<div class="flex flex-col gap-0.5 px-2 py-1.5">
					<span>{customer.name}</span>
					<span>{customer.phone}</span>
				</div>
			</div>
		</div>
	</div>
	<div class="flex flex-col border-1 border-gray-800 text-[10px]">
		<div class="flex flex-row border-b-1 border-b-gray-800 bg-zinc-400 font-bold text-gray-800">
			<span class="w-[42%] border-r-1 border-r-gray-800 px-2 py-1 text-center">REF</span>
			<span class="w-[8%] border-r-1 border-r-gray-800 px-2 py-1 text-center">CANT</span>
			<span class="w-[20%] border-r-1 border-r-gray-800 px-2 py-1 text-center">PRECIO</span>
			<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">% DTO</span>
			<span class="w-[20%] px-2 py-1 text-center">IMPORTE</span>
		</div>
		{#each Object.values(orderSet.orders) as fullOrder (fullOrder.order.id)}
			<div
				class="flex flex-row border-b-1 border-b-gray-800 font-['Google_Sans_Code',_monospace] last:border-b-0"
			>
				<span class="w-[42%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
					{fullOrder.order.publicId}
				</span>
				<span class="w-[8%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
					{fullOrder.order.item.quantity}
				</span>
				<span class="w-[20%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
					{fullOrder.totals.unitPriceWithoutDiscount} €
				</span>
				<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
					{fullOrder.calculatedItem.discount} %
				</span>
				<span class="w-[20%] px-2 py-1 text-center">
					{fullOrder.totals.total} €
				</span>
			</div>
		{/each}
	</div>

	<div class="ml-auto flex w-fit flex-col border-1 border-gray-800 text-[10px]">
		<div class="flex flex-row border-b-1 border-b-gray-800 bg-zinc-400 font-bold text-gray-800">
			<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center">BASE</span>
			<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center">21% IVA</span>
			<span class="w-[100px] px-2 py-1 text-center">TOTAL</span>
		</div>
		<div class="flex flex-row font-['Google_Sans_Code',_monospace]">
			<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center">
				{base.toFixed(2)} €
			</span>
			<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center">
				{tax.toFixed(2)} €
			</span>
			<span class="w-[100px] px-2 py-1 text-center">
				{total.toFixed(2)} €
			</span>
		</div>
	</div>
	<div class="font-['Google_Sans_Code',_monospace] text-[10px]">
		<p class="m-0 text-center">
			<strong>IBAN ES13 2100 6805 9102 0013 3197 / SWIFT CAIXESBBXXX</strong>
		</p>
	</div>
</div>
