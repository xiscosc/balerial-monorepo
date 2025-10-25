<script lang="ts">
	import type { Customer, Order } from '@marcsimolduressonsardina/core/type';
	import Button from '@/components/generic/button/Button.svelte';
	import { ButtonAction, ButtonStyle } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { trackEvent } from '@/shared/fronted-analytics/posthog';
	import { OrderApiGateway } from '@/gateway/order-api.gateway';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';

	interface Props {
		label: string;
		message: string;
		customer: Customer;
		disabled?: boolean;
		orders?: Order[];
		notifyOrder?: boolean;
		tooltipText?: string | undefined;
		handleAfterNotify?: () => void;
	}

	let {
		label,
		message,
		customer,
		disabled = false,
		orders = [],
		notifyOrder = false,
		tooltipText = undefined,
		handleAfterNotify = () => {}
	}: Props = $props();

	let loading = $state(true);
	let actionRendered = $state(false);
	let notified = $state(false);

	async function handleNotify() {
		notified = true;
		if (orders.length === 0) {
			return;
		}

		const promises = orders.map((order) => OrderApiGateway.notifyOrder(order.id));
		await getGlobalProfiler().measure(Promise.all(promises));

		orders.forEach((order) => {
			order.notified = true ;
		});

		handleAfterNotify();
		loading = false;
	}

	function trackWhatsAppClicked() {
		trackEvent('WhatsApp clicked', { action: label, customerId: customer.id });
	}

	function getWhatsappLink(customer: Customer, text?: string): string {
		const link = `https://wa.me/${customer.phone.replace('+', '')}`;
		const encodedText = text == null ? '' : `?text=${encodeURI(text)}`;
		return link + encodedText;
	}

	function triggerNotify() {
		actionRendered = true;
	}

	$effect(() => {
		if (actionRendered && !notified) {
			handleNotify();
		}
	});
</script>

{#if notifyOrder && !disabled}
	<BottomSheet
		title="WhatsApp"
		description=""
		iconType={IconType.WHATSAPP}
		triggerStyle={ButtonStyle.WHATSAPP}
	>
		{#snippet trigger()}
			<Button icon={IconType.WHATSAPP} text={label} action={ButtonAction.TRIGGER}></Button>
		{/snippet}

		{#snippet action()}
			<div class="flex" {@attach triggerNotify}>
				{#if loading}
					<ProgressBar text="Marcando pedido como notificado"></ProgressBar>
				{/if}
			</div>
			{#if !loading}
				<div class="flex">
					<Button
						icon={IconType.WHATSAPP}
						action={ButtonAction.LINK}
						trackFunction={trackWhatsAppClicked}
						newWindow={true}
						text="Enviar mensaje a cliente"
						style={ButtonStyle.WHATSAPP}
						{disabled}
						{tooltipText}
						link={getWhatsappLink(customer, message)}
					></Button>
				</div>
			{/if}
		{/snippet}
	</BottomSheet>
{:else}
	<Button
		icon={IconType.WHATSAPP}
		action={ButtonAction.LINK}
		trackFunction={trackWhatsAppClicked}
		newWindow={true}
		text={label}
		style={ButtonStyle.WHATSAPP}
		{disabled}
		{tooltipText}
		link={getWhatsappLink(customer, message)}
	></Button>
{/if}
