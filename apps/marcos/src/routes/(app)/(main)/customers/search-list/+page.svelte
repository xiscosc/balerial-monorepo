<script lang="ts">
	import type { PageData } from './$types';
	import ProgressBar from '@/components/generic/ProgressBar.svelte';
	import Button from '@/components/generic/button/Button.svelte';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Box from '@/components/generic/Box.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let measuredCustomers = $derived(getGlobalProfiler().measure(data.customers));
</script>

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.SEARCH}>
		Búsqueda de clientes - {data.decodedSearchQuery}
	</SimpleHeading>
	{#await measuredCustomers}
		<Box><ProgressBar text="Buscando clientes" /></Box>
	{:then customers}
		<div class="flex w-full flex-col gap-1 lg:grid lg:grid-cols-4">
			{#each customers as customer (customer.id)}
				<Button
					textType={ButtonText.GRAY}
					link={`/customers/${customer.id}`}
					text={customer.name}
					icon={IconType.USER}
					style={ButtonStyle.ORDER_GENERIC}
				></Button>
			{/each}
		</div>
		{#if customers.length === 0}
			<Box title="Sin Resultados" icon={IconType.USER}>
				<p class="text-md">No se han encontrado clientes</p>
			</Box>
		{/if}
	{/await}
</div>
