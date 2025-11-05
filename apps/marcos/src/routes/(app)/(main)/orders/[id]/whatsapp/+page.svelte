<script lang="ts">
	import Box from '@/components/generic/Box.svelte';

	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import type { PageData } from './$types';

	import { OrderStatus } from '@marcsimolduressonsardina/core/type';
	import WhatsAppButton from '@/components/business-related/button/WhatsAppButton.svelte';
	import { getStatusUIInfo } from '@/ui/ui.helper';
	import Banner from '@/components/generic/Banner.svelte';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let whatsAppNotified = $state(false);

	function handleAfterNotify() {
		whatsAppNotified = true;
	}
</script>

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.SENT}>Mensaje de finalizado</SimpleHeading>
	{#if data.order}
		{#if data.order.status === OrderStatus.FINISHED}
			{#if data.orderCounters.totalCount > 1}
				<Box>
					<div class="flex flex-col gap-2">
						{#if data.orderCounters.pendingCount > 0}
							<Banner
								icon={IconType.ALERT}
								color={getStatusUIInfo(OrderStatus.PENDING).bannerColor}
								title="Hay pedidos pendientes"
								text="Tienes pedidos pendientes del mismo día. Puedes enviar el mensaje de finalizado
										de este pedido o revisar los otros pedidos del día."
							></Banner>
						{:else}
							<Banner
								icon={IconType.ALERT}
								color={getStatusUIInfo(OrderStatus.FINISHED).bannerColor}
								title="Todos los pedidos del día están finalizados"
								text=""
							></Banner>
						{/if}
						{#if data.order.notified || whatsAppNotified}
							<Banner
								icon={IconType.SENT}
								color={getStatusUIInfo(OrderStatus.PICKED_UP).bannerColor}
								title="Cliente avisado"
								text=""
							></Banner>
						{/if}

						<div class="flex flex-col gap-2 lg:flex-row">
							<MarcosButton
								variant={ButtonStyle.ORDER_GENERIC}
								textVariant={ButtonText.GRAY}
								icon={IconType.ORDER_DEFAULT}
								onclick={() => goto(resolve(`/orders/${data.order.id}/day`))}
							>
								Ver pedidos del día
							</MarcosButton>
							<WhatsAppButton
								label="Enviar mensaje finalizado"
								message={OrderRepresentationUtilities.getWhatsappFinishedText([data.order])}
								customer={data.order.customer}
								{handleAfterNotify}
								notifyOrder={true}
								orders={[data.order]}
							></WhatsAppButton>
						</div>
					</div>
				</Box>
			{/if}
		{/if}
	{/if}
</div>
