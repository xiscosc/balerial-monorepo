<script lang="ts">
	import { ActionBarState } from '@/state/action-bar/action-bar.state.svelte';

	interface Props {
		visible?: boolean;
	}

	let { visible = false }: Props = $props();
</script>

<!-- Action Bar -->
{#if ActionBarState.isVisible()}
	<div
		class="fixed right-0 bottom-0 left-0 z-20 flex items-center justify-center px-2 py-3 print:hidden"
	>
		<div
			class="w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm md:px-4 md:py-3 lg:max-w-[1650px]"
		>
			<div class="flex flex-row items-center justify-between gap-2">
				<!-- Left section -->
				<div class="flex items-center gap-2">
					<span class="text-sm text-gray-700">Action Bar</span>
				</div>

				<!-- Center section -->
				<div class="flex items-center gap-2">
					<!-- Add your action buttons here -->
				</div>

				<!-- Right section -->
				<div class="flex items-center gap-2">
					<!-- Add more actions here -->
				</div>
			</div>
		</div>
	</div>
{/if}
