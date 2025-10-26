<script lang="ts">
	import type { PageData } from './$types';

	import { IconType } from '@/components/generic/icon/icon.enum';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';
	import Button from '@/components/generic/button/Button.svelte';
	import OrderSetPrint from '@/components/business-related/order-set/OrderSetPrint.svelte';
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	import Box from '@/components/generic/Box.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let measuredOrderSet = $derived(getGlobalProfiler().measure(data.orderSet));
</script>

{#await measuredOrderSet}
	<Box>
		<ProgressBar text="Generando listado..."></ProgressBar>
	</Box>
{:then orderSet}
	{#if orderSet}
		<OrderSetPrint {orderSet}></OrderSetPrint>
	{:else}
		<div class="flex flex-col gap-2">
			<Box icon={IconType.NOT_FOUND} title="Error">
				<p class="text-center text-lg md:text-left">No se ha encontrado el listado</p>
			</Box>
			<Button text="Volver atrás" icon={IconType.LEFT} onClick={() => window.history.back()}
			></Button>
		</div>
	{/if}
{/await}
