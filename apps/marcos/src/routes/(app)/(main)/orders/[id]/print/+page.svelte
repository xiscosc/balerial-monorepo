<script lang="ts">
	import type { PageData } from './$types';
	import { identifyUser } from '@/shared/fronted-analytics/posthog';
	import OrderPrint from '@/components/business-related/order-detail/OrderPrint.svelte';
	import Button from '@/components/generic/button/Button.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import Box from '@/components/generic/Box.svelte';
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	const fullOrderPromise = getGlobalProfiler().measure(data.fullOrder);
	identifyUser(data.user, data.envName);
</script>

{#await fullOrderPromise}
	<Box>
		<ProgressBar text="Generando resguardo..."></ProgressBar>
	</Box>
{:then fullOrder}
	{#if fullOrder}
		{#snippet actionButtons()}
			<Button text="Volver atrás" icon={IconType.LEFT} onClick={() => window.history.back()}
			></Button>
			<Button
				text="Ir al pedido"
				icon={IconType.ORDER_DEFAULT}
				link={`/orders/${fullOrder.order.id}`}
			></Button>
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
			<Button text="Volver atrás" icon={IconType.LEFT} onClick={() => window.history.back()}
			></Button>
		</div>
	{/if}
{/await}
