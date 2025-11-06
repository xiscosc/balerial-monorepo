<script lang="ts">
	import { ActionBarState } from '@/state/action-bar/action-bar.state.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import { slide, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { ButtonSize } from '@/components/generic/button/button.enum';

	function close() {
		ActionBarState.hide();
		ActionBarState.getCloseHandler()();
	}
</script>

<!-- Action Bar -->
{#if ActionBarState.isVisible()}
	<div
		class="fixed right-0 bottom-0 left-0 z-20 flex items-center justify-center px-2 py-5 print:hidden"
		in:slide={{ duration: 300, easing: cubicOut }}
		out:slide={{ duration: 250, easing: cubicOut }}
	>
		<div
			class="relative w-full rounded-lg border border-gray-300 bg-white/70 px-3 py-2 shadow-lg backdrop-blur-sm md:px-4 md:py-3 lg:max-w-[1650px]"
			in:fade={{ duration: 200, delay: 100 }}
			out:fade={{ duration: 150 }}
		>
			<div class="flex flex-col gap-2">
				{#if ActionBarState.getActionsSectionSnippet()}
					<div class="flex items-center justify-center">
						{@render ActionBarState.getActionsSectionSnippet()?.()}
					</div>
				{/if}

				<div class="flex flex-row items-center justify-between gap-2">
					<div class="flex items-center gap-2">
						{@render ActionBarState.getStartSectionSnippet()?.()}
					</div>

					<div class="flex items-center gap-2">
						{@render ActionBarState.getCenterSectionSnippet()?.()}
					</div>

					<div class="flex items-center gap-2">
						<MarcosButton
							size={ButtonSize.SMALL}
							iconSize={IconSize.SMALL}
							icon={IconType.CLOSE}
							onclick={close}
						></MarcosButton>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
