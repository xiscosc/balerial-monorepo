<script lang="ts">
	import type { PageData } from './$types';

	import { IconType } from '@/components/generic/icon/icon.enum';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import OrderSetPrint from '@/components/business-related/order-set/OrderSetPrint.svelte';
	import Loading from '@/components/generic/Loading.svelte';
	import Box from '@/components/generic/Box.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let measuredOrderSet = $derived(getGlobalProfiler().measure(data.orderSet));
</script>

{#await measuredOrderSet}
	<Box>
		<Loading text="Generando listado..."></Loading>
	</Box>
{:then orderSet}
	{#if orderSet}
		<OrderSetPrint {orderSet}></OrderSetPrint>
	{:else}
		<div class="flex flex-col gap-2">
			<Box icon={IconType.NOT_FOUND} title="Error">
				<p class="text-center text-lg md:text-left">No se ha encontrado el listado</p>
			</Box>
			<MarcosButton icon={IconType.LEFT} onclick={() => window.history.back()}>
				Volver atrás
			</MarcosButton>
		</div>
	{/if}
{/await}
