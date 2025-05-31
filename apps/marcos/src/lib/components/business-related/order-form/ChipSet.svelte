<script lang="ts">
	import { ChipSetStateClass } from '@/components/business-related/order-form/ChipSet.state.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';

	let {
		values,
		filledValues = $bindable([])
	}: {
		values: string[];
		filledValues: string[];
	} = $props();

	const chipSetState = new ChipSetStateClass(values, $state.snapshot(filledValues));
	$effect(() => {
		filledValues = [...chipSetState.selectedValues];
	});
</script>

{#each values as value (value)}
	<button
		class="flex w-full flex-row items-center justify-center gap-2 rounded-sm bg-gray-800 p-1 text-sm text-white"
		class:bg-indigo-800={chipSetState.isSelected(value)}
		type="button"
		onclick={() => {
			chipSetState.toggle(value);
		}}
	>
		{#if chipSetState.isSelected(value)}
			<Icon type={IconType.DONE} size={IconSize.SMALL} />
		{/if}
		<span>
			{value}
		</span>
	</button>
{/each}
