<script lang="ts">
	import type { PageData } from './$types';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import Qr from '@/components/generic/Qr.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import { DateTime } from 'luxon';
	import { orderStatusMap } from '@/shared/mappings/order.mapping';
	import { getStatusUIInfo } from '@/ui/ui.helper';
	import OrderInfoStep from '@/components/business-related/order-detail/OrderInfoStep.svelte';
	import { QrOrigin } from '@/type/qr.type';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { QrUtilities } from '@/shared/order/qr.utilities';
	import { asset, resolve } from '$app/paths';
	import MarcosLink from '@/components/generic/button/MarcosLink.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<meta property="og:title" content="Resguardo del pedido" />
	<meta property="og:description" content={`Pedido ${data.fullOrder.order.publicId}`} />
	<meta
		property="og:image"
		content="https://marcsimoldures.com/wp-content/uploads/2017/02/MMlogo111.png"
	/>
	<meta
		property="og:url"
		content={OrderRepresentationUtilities.getOrderPublicUrl(data.fullOrder.order)}
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<div
	class="flex w-full flex-col items-center gap-2 p-4 font-sans md:min-h-screen md:justify-center md:p-0 md:pt-4"
>
	<div class="flex w-full flex-col items-center gap-2">
		<div
			class="flex w-full flex-col items-center justify-center gap-4 rounded-xl border bg-white pt-2 pb-4 md:w-2/3 lg:w-1/3"
		>
			<div class="flex w-full flex-col items-center">
				<img class="w-1/2" src={asset('/mmlogo.png')} alt="logo" />
				<span class="px-2 text-center text-[0.625rem]">
					Horario de lunes a viernes de 09:00 a 18:00, sábados de 09:30 a 13:15
				</span>
			</div>

			<div class="flex rounded-xl border p-3">
				<Qr
					size={125}
					qrData={QrUtilities.generateQrStringForOrder({
						orderId: data.fullOrder.order.id,
						origin: QrOrigin.CUSTOMER_V2
					})}
				></Qr>
			</div>
			<span class="font-mono text-xs">
				{data.fullOrder.order.publicId}
			</span>
			<div class="flex flex-row gap-2">
				<span
					class={`rounded-2xl border-black px-3 py-1 text-xs font-semibold text-white uppercase ${getStatusUIInfo(data.fullOrder.order.status).staticColor}`}
				>
					{orderStatusMap[data.fullOrder.order.status]}
				</span>
				<span
					class="rounded-2xl border-indigo-900 bg-indigo-700 px-3 py-1 text-xs font-semibold text-white uppercase"
				>
					{data.fullOrder.totals.total.toFixed(2) + ' €'}
				</span>
			</div>

			<div class="flex flex-col gap-3 px-5">
				<div class="flex flex-col gap-2">
					<OrderInfoStep
						iconType={IconType.CLOCK}
						title="Fecha de entrada"
						value={data.fullOrder.order.item.instantDelivery
							? 'Al momento'
							: DateTime.fromJSDate(data.fullOrder.order.createdAt).toFormat('dd/MM/yyyy')}
					/>
					<OrderInfoStep
						iconType={IconType.TRUCK}
						title="Fecha de recogida estimada"
						value={data.fullOrder.order.item.instantDelivery
							? 'Al momento'
							: DateTime.fromJSDate(data.fullOrder.order.item.deliveryDate).toFormat('dd/MM/yyyy')}
					/>
					<OrderInfoStep
						iconType={IconType.EYE}
						title="Descripción"
						value={data.fullOrder.order.item.description}
					/>
					<OrderInfoStep
						iconType={IconType.LIST}
						title="Observaciones"
						value={data.fullOrder.order.item.observations}
						valueList={data.fullOrder.order.item.predefinedObservations}
					/>
				</div>

				<MarcosLink icon={IconType.PHONE} href="tel:+34971666920">Llamar</MarcosLink>
				<span class="text-center text-[0.625rem]">
					Una vez pasados <span class="font-semibold">
						15 días desde la fecha estipulada de entrega
					</span>, la empresa
					<span class="font-semibold"> no se hará cargo del material. </span>
				</span>
			</div>
		</div>
		<a
			href={resolve('/(public)/s/[id]', { id: data.fullOrder.order.shortId })}
			target="_blank"
			class="text-xs"
		>
			<span class="flex items-center gap-1 hover:underline">
				<Icon type={IconType.PRINTER} size={IconSize.SMALL}></Icon> Versión para imprimir
			</span>
		</a>
	</div>

	<span class="text-center text-[0.625rem] text-gray-500">
		Desarrollado por <a class="font-semibold" href="https://balerial-apps.com" target="_blank">
			balerial-apps.com
		</a>. {DateTime.now().toFormat('yyyy')}.
	</span>
</div>
