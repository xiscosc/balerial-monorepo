<script lang="ts">
	import { OrderRepresentationUtilities } from '@/shared/order/order-representation.utilities';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import TooltipButtonWrapper from '@/components/generic/button/TooltipButtonWrapper.svelte';
	import WhatsAppButton from '@/components/business-related/button/WhatsAppButton.svelte';
	import Divider from '@/components/generic/Divider.svelte';
	import { OrderStatus, type Order } from '@marcsimolduressonsardina/core/type';
	import { ButtonVariant } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import type { ISameDayOrderCounters } from '@marcsimolduressonsardina/core/service';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	export let order: Order;
	export let counters: ISameDayOrderCounters;
	export let hasFiles: boolean;
	let whatsAppNotified = false;

	function handleAfterNotify() {
		whatsAppNotified = true;
	}
</script>

<Divider></Divider>
{#if order.status === OrderStatus.QUOTE}
	<WhatsAppButton
		label="Enviar presupuesto"
		message={OrderRepresentationUtilities.getWhatsappQuoteText(order)}
		customer={order.customer}
		tooltipText="Faltan fotos"
		disabled={!hasFiles}
	></WhatsAppButton>
{:else}
	<WhatsAppButton
		label="Enviar resguardo"
		message={OrderRepresentationUtilities.getWhatsappTicketText(order)}
		customer={order.customer}
		tooltipText="Faltan fotos"
		disabled={!hasFiles}
	></WhatsAppButton>
{/if}
{#if order.status === OrderStatus.FINISHED}
	{#if order.notified || whatsAppNotified}
		<div
			class="flex w-full flex-row items-center justify-center gap-2 rounded-sm border-2 border-green-700 bg-white py-1"
		>
			<div class="flex items-center rounded-full bg-green-100 px-2 py-1 text-green-700">
				<Icon type={IconType.SENT} />
			</div>
			<span class="text-md font-semibold text-green-700">Cliente avisado</span>
		</div>
	{/if}
	{#if counters.totalCount === 1}
		<WhatsAppButton
			label="Enviar mensaje finalizado"
			message={OrderRepresentationUtilities.getWhatsappFinishedText([order])}
			customer={order.customer}
			notifyOrder={true}
			{handleAfterNotify}
			orders={[order]}
			tooltipText="Faltan fotos"
			disabled={!hasFiles}
		></WhatsAppButton>
	{:else}
		<TooltipButtonWrapper text="Faltan fotos" enabled={!hasFiles}>
			<MarcosButton
				icon={IconType.WHATSAPP}
				onclick={() => goto(resolve(`/orders/${order.id}/whatsapp`))}
				variant={ButtonVariant.WHATSAPP}
				disabled={!hasFiles}
			>
				Enviar mensaje finalizado
			</MarcosButton>
		</TooltipButtonWrapper>
	{/if}
{/if}
