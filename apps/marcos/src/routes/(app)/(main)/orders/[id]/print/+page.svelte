<script lang="ts">
	import type { PageData } from './$types';
	import { identifyUser } from '@/shared/fronted-analytics/posthog';
	import OrderPrint from '@/components/business-related/order-detail/OrderPrint.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import Box from '@/components/generic/Box.svelte';
	import Loading from '@/components/generic/Loading.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const fullOrderPromise = getGlobalProfiler().measure(data.fullOrder);
	identifyUser(data.user, data.envName);
</script>

{#await fullOrderPromise}
	<Box>
		<Loading text="Generando resguardo..."></Loading>
	</Box>
{:then fullOrder}
	{#if fullOrder}
		{#snippet actionButtons()}
			<MarcosButton icon={IconType.LEFT} onclick={() => window.history.back()}>
				Volver atrás
			</MarcosButton>
			<MarcosButton
				icon={IconType.ORDER_DEFAULT}
				onclick={() => goto(resolve(`/orders/${fullOrder.order.id}`))}
			>
				Ir al pedido
			</MarcosButton>
		{/snippet}
		<div class="flex w-full items-center justify-center print:block">
			<div class="w-fit print:w-auto">
				<OrderPrint {fullOrder} print buttons={actionButtons}></OrderPrint>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			<Box icon={IconType.NOT_FOUND} title="Error">
				<p class="text-center text-lg md:text-left">No se ha encontrado el pedido</p>
			</Box>
			<MarcosButton icon={IconType.LEFT} onclick={() => window.history.back()}>
				Volver atrás
			</MarcosButton>
		</div>
	{/if}
{/await}
