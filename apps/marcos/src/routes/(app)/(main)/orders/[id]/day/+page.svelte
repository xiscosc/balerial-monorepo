<script lang="ts">
	import type { PageData } from './$types';
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import WhatsAppButton from '@/components/business-related/button/WhatsAppButton.svelte';
	import Banner from '@/components/generic/Banner.svelte';
	import { getStatusUIInfo } from '@/ui/ui.helper';
	import { type Order, OrderStatus } from '@marcsimolduressonsardina/core/type';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import OrderList from '@/components/business-related/order-list/OrderList.svelte';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let measuredOrders = $derived(getGlobalProfiler().measure(data.orders));
	let whatsappDisabled = $state(true);
	let whatsAppOrders: Order[] = $state([]);
	let whatsAppText = $state('');
	let whatsAppNotified = $state(false);

	function handleAfterNotify() {
		whatsAppNotified = true;
	}

	$effect(() => {
		if (measuredOrders == null) {
			whatsappDisabled = true;
			whatsAppText = '';
			whatsAppOrders = [];
			return;
		}
		measuredOrders.then((fullOrders) => {
			whatsappDisabled =
				fullOrders.filter(
					(fullOrder) =>
						fullOrder.order.status === OrderStatus.FINISHED ||
						fullOrder.order.status === OrderStatus.PICKED_UP
				).length !== fullOrders.length;

			whatsAppText = OrderRepresentationUtilities.getWhatsappFinishedText(
				fullOrders
					.map((fullOrder) => fullOrder.order)
					.filter((order) => order.status === OrderStatus.FINISHED)
			);

			whatsAppOrders = fullOrders
				.map((fullOrder) => fullOrder.order)
				.filter((order) => order.status === OrderStatus.FINISHED);
		});
	});
</script>

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.DAY}>
		<div class="flex flex-col lg:flex-row lg:gap-2">
			<span>Pedidos del mismo día</span>
			<span class="text-gray-600">{data.customer.name}</span>
		</div>
	</SimpleHeading>

	<div class="flex w-full flex-col place-content-center items-center justify-center gap-2">
		<WhatsAppButton
			label="Enviar mensaje todos finalizados"
			message={whatsAppText}
			customer={data.customer}
			tooltipText="Hay pedidos pendientes"
			notifyOrder={true}
			{handleAfterNotify}
			orders={whatsAppOrders}
			disabled={whatsappDisabled}
		></WhatsAppButton>
	</div>

	{#if whatsAppNotified}
		<Banner
			icon={IconType.SENT}
			color={getStatusUIInfo(OrderStatus.PICKED_UP).bannerColor}
			title="Cliente avisado"
			text="El mensaje de finalizado se ha enviado para todos los pedidos"
		></Banner>
	{/if}

	<OrderList promiseOrders={measuredOrders} />
</div>
