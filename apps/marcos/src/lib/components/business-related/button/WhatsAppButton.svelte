<script lang="ts">
	import type { Customer, Order } from '@marcsimolduressonsardina/core/type';
	import { ButtonVariant } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { OrderApiGateway } from '@/gateway/order-api.gateway';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import MarcosLink from '@/components/generic/button/MarcosLink.svelte';
	import TooltipButtonWrapper from '@/components/generic/button/TooltipButtonWrapper.svelte';
	import { BatchOperation } from '@/type/api.type';

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

		const orderIds = orders.map((order) => order.id);
		await getGlobalProfiler().measure(
			OrderApiGateway.patchOrders(orderIds, [BatchOperation.NOTIFY_ORDERS])
		);

		orders.forEach((order) => {
			order.notified = true;
		});

		handleAfterNotify();
		loading = false;
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
	<BottomSheet title="WhatsApp" description="" iconType={IconType.WHATSAPP}>
		{#snippet trigger({ props }: { props: Record<string, unknown> })}
			<MarcosButton {...props} icon={IconType.WHATSAPP} variant={ButtonVariant.WHATSAPP}>
				{label}
			</MarcosButton>
		{/snippet}

		{#snippet action()}
			<div class="flex" {@attach triggerNotify}>
				{#if loading}
					<ProgressBar text="Marcando pedido como notificado"></ProgressBar>
				{/if}
			</div>
			{#if !loading}
				<div class="flex">
					<TooltipButtonWrapper text={tooltipText ?? ''} enabled={disabled}>
						<MarcosLink
							href={getWhatsappLink(customer, message)}
							target="_blank"
							icon={IconType.WHATSAPP}
							variant={ButtonVariant.WHATSAPP}
							{disabled}
						>
							{label}
						</MarcosLink>
					</TooltipButtonWrapper>
				</div>
			{/if}
		{/snippet}
	</BottomSheet>
{:else}
	<TooltipButtonWrapper text={tooltipText ?? ''} enabled={disabled}>
		<MarcosLink
			href={getWhatsappLink(customer, message)}
			target="_blank"
			icon={IconType.WHATSAPP}
			variant={ButtonVariant.WHATSAPP}
			{disabled}
		>
			{label}
		</MarcosLink>
	</TooltipButtonWrapper>
{/if}
