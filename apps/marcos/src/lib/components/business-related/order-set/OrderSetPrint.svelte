<script lang="ts">
	import type { OrderSet } from '@marcsimolduressonsardina/core/type';
	import { QrUtilities } from '@/shared/order/qr.utilities';
	import Qr from '@/components/generic/Qr.svelte';
	import { asset } from '$app/paths';
	import { DateTime } from 'luxon';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Button from '@/components/generic/button/Button.svelte';
	import { onMount } from 'svelte';

	let { orderSet }: { orderSet: OrderSet } = $props();

	let customer = $derived(orderSet.orders[Object.keys(orderSet.orders)[0]]!.order.customer);

	let total = $derived(
		Object.values(orderSet.orders).reduce((acc, fullOrder) => acc + fullOrder.totals.total, 0)
	);

	let base = $derived(total / 1.21);
	let tax = $derived(total - base);

	onMount(() => {
		setTimeout(() => {
			window.print();
		}, 750);
	});
</script>

<main class="flex flex-col gap-2 print:block">
	<div
		class="flex flex-col gap-4 p-4 print:break-inside-avoid print:pb-8 print:[-webkit-print-color-adjust:exact] print:[print-color-adjust:exact]"
		id="order-set-print"
	>
		<div class="mb-4 flex flex-row justify-between gap-2">
			<div class="flex h-[109px] w-2/5 flex-col items-center justify-center p-0.5 text-[9px]">
				<img class="h-[75px]" src={asset('/mmlogo.png')} alt="logo" />
				<div class="font-sans">
					<p class="m-0 text-center">Polígono de Son Rossinyol - Gremi Hortolans 19 - 971666920</p>
					<p class="m-0 text-center">www.marcsimoldures.com - mmss@marcsimoldures.com</p>
					<p class="m-0 text-center">Horario de lunes a viernes de 09:00 a 18:00,</p>
					<p class="m-0 text-center">sábados de 09:30 a 13:15</p>
				</div>
			</div>

			<div class="flex h-[109px] w-1/5 items-center justify-center">
				<Qr
					size={109}
					qrData={QrUtilities.generateQrStringForOrderSet({
						orderSetId: orderSet.id
					})}
				></Qr>
			</div>

			<div class="flex w-2/5 flex-col gap-2">
				<div class="flex flex-col border-1 border-gray-800 text-[10px]">
					<div
						class="border-b-1 border-b-gray-800 bg-zinc-400 px-2 py-1 text-center font-bold text-gray-800"
					>
						DATOS DEL CLIENTE
					</div>
					<div class="flex flex-col gap-0.5 px-2 py-1.5 font-mono">
						<span>{customer.name}</span>
						<span>{customer.phone}</span>
					</div>
				</div>
				<div class="flex flex-col border-1 border-gray-800 text-[10px]">
					<div class="flex flex-row">
						<span class="w-1/2 border-r-1 border-r-gray-800 px-2 py-1 text-center font-bold">
							RESUMEN
						</span>
						<span
							class="w-1/2 border-r-1 border-r-gray-800 bg-zinc-400 px-2 py-1 text-center font-bold text-gray-800"
						>
							FECHA
						</span>
						<span class="w-1/2 bg-none px-2 py-1 text-center">
							{DateTime.fromJSDate(orderSet.createdAt).toFormat('dd/MM/yyyy')}
						</span>
					</div>
				</div>
			</div>
		</div>

		<div class="flex flex-col border-1 border-gray-800 text-[10px]">
			<div class="flex flex-row border-b-1 border-b-gray-800 bg-zinc-400 font-bold text-gray-800">
				<span class="w-[30%] border-r-1 border-r-gray-800 px-2 py-1 text-center">Descripción</span>
				<span class="w-[5%] border-r-1 border-r-gray-800 px-2 py-1 text-center">Unid.</span>
				<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">Precio</span>
				<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">IVA</span>
				<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">PVP</span>
				<span class="w-[5%] border-r-1 border-r-gray-800 px-2 py-1 text-center">%Dto.</span>
				<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">P.C.Dto</span>
				<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">Tot.SinIVA</span>
				<span class="w-[10%] px-2 py-1 text-center">Total</span>
			</div>
			{#each Object.values(orderSet.orders) as fullOrder (fullOrder.order.id)}
				<div class="flex flex-row border-b-1 border-b-gray-800 font-mono last:border-b-0">
					<span class="w-[30%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
						{fullOrder.order.publicId}
					</span>
					<span class="w-[5%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
						{fullOrder.order.item.quantity}
					</span>
					<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
						{(fullOrder.totals.unitPriceWithoutDiscount / 1.21).toFixed(2)}
					</span>
					<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
						{(
							fullOrder.totals.unitPriceWithoutDiscount -
							fullOrder.totals.unitPriceWithoutDiscount / 1.21
						).toFixed(2)}
					</span>
					<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
						{fullOrder.totals.unitPriceWithoutDiscount.toFixed(2)}
					</span>
					<span class="w-[5%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
						{fullOrder.calculatedItem.discount}
					</span>
					<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
						{fullOrder.totals.unitPrice.toFixed(2)}
					</span>
					<span class="w-[10%] border-r-1 border-r-gray-800 px-2 py-1 text-center">
						{(fullOrder.totals.total / 1.21).toFixed(2)}
					</span>
					<span class="w-[10%] px-2 py-1 text-center">
						{fullOrder.totals.total.toFixed(2)}
					</span>
				</div>
			{/each}
		</div>

		<div class="ml-auto flex w-fit flex-col border-1 border-gray-800 text-[10px] print:mt-auto">
			<div class="flex flex-row border-b-1 border-b-gray-800 bg-zinc-400 font-bold text-gray-800">
				<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center">
					Base Imponible
				</span>
				<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center">IVA</span>
				<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center">RE</span>
				<span class="w-[100px] px-2 py-1 text-center">TOTAL</span>
			</div>
			<div class="flex flex-row font-mono">
				<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center">
					{base.toFixed(2)}
				</span>
				<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center">
					{tax.toFixed(2)}
				</span>
				<span class="w-[100px] border-r-1 border-r-gray-800 px-2 py-1 text-center"> 00 </span>
				<span class="w-[100px] px-2 py-1 text-center font-bold">
					{total.toFixed(2)}
				</span>
			</div>
		</div>
	</div>
	<div class="flex flex-col gap-2 md:flex-row print:hidden">
		<Button text="Volver atrás" icon={IconType.LEFT} onClick={() => window.history.back()}></Button>
		<Button text="Ir al cliente" icon={IconType.USER} link={`/customers/${customer.id}`}></Button>
	</div>
</main>
