<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ButtonStyle, ButtonText, ButtonType } from '@/components/generic/button/button.enum';
	import BottomSheet from '@/components/generic/BottomSheet.svelte';
	import BottomSheetLoading from '@/components/generic/BottomSheetLoading.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';

	let sheetLoading = $state(false);

	interface Props {
		title: string;
		quantity?: number;
		subtitle: string;
		icon: IconType;
		deleteFunction?: () => void;
		otherAction?: Snippet;
		showDelete?: boolean;
		deleteConfirmation?: boolean;
		textList?: string[];
	}

	let {
		title,
		subtitle,
		icon,
		deleteFunction = () => {},
		showDelete = false,
		quantity = 0,
		otherAction = undefined,
		textList = [],
		deleteConfirmation = false
	}: Props = $props();

	function handleBottomSheetDelete() {
		sheetLoading = true;
		deleteFunction();
		sheetLoading = false;
	}
</script>

<div class="flex w-full flex-col gap-2 rounded-md border border-gray-300 bg-stone-50 px-2 py-1">
	<div class="flex w-full flex-row justify-between">
		<div class="flex flex-row items-center justify-start gap-2">
			<div class="relative rounded-full border border-gray-700 bg-white p-2 text-gray-900">
				<div class="relative">
					<Icon type={icon} />
				</div>
				{#if quantity > 1}
					<span
						class="animate-in zoom-in-50 absolute -top-1 -right-1 rounded-full border border-red-800 bg-red-500 px-1 text-xs font-medium text-white transition-all duration-300 ease-out"
					>
						{quantity}
					</span>
				{/if}
			</div>
			<div class="flex flex-col gap-1 pr-1 text-sm">
				<span class="line-clamp-1 font-medium">{title}</span>
				<span class="line-clamp-2">{subtitle}</span>
			</div>
		</div>
		<div class="flex flex-row items-center gap-1">
			{@render otherAction?.()}
			{#if showDelete}
				{#if !deleteConfirmation}
					<MarcosButton
						icon={IconType.TRASH}
						variant={ButtonStyle.SOFT_DELETE}
						textVariant={ButtonText.GRAY}
						size={ButtonType.DEFAULT}
						onclick={() => deleteFunction()}
					></MarcosButton>
				{:else}
					<BottomSheet
						title="Eliminar elemento"
						description="Esta acción no se puede deshacer"
						iconType={IconType.TRASH}
					>
						{#snippet trigger({ props }: { props: Record<string, unknown> })}
							<MarcosButton
								icon={IconType.TRASH}
								variant={ButtonStyle.SOFT_DELETE}
								textVariant={ButtonText.GRAY}
								size={ButtonType.DEFAULT}
								{...props}
							></MarcosButton>
						{/snippet}
						{#snippet action()}
							{#if sheetLoading}
								<BottomSheetLoading />
							{:else}
								<MarcosButton
									icon={IconType.TRASH}
									variant={ButtonStyle.DELETE}
									onclick={() => handleBottomSheetDelete()}
								>
									Confirmar
								</MarcosButton>
							{/if}
						{/snippet}
					</BottomSheet>
				{/if}
			{/if}
		</div>
	</div>

	{#if textList.length > 0}
		<div class="px-2">
			<ul class="flex flex-col gap-1">
				{#each textList as value (value)}
					<li class="text-sm break-words whitespace-normal text-gray-800">{value}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
