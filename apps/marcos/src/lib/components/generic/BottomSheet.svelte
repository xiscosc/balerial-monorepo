<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Sheet from '@/components/ui/sheet/index.js';
	import * as Dialog from '@/components/ui/dialog/index.js';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';

	interface Props {
		title?: string;
		iconType?: IconType;
		description?: string;
		trigger: Snippet<[{ props: Record<string, unknown> }]>;
		action: Snippet;
	}

	let {
		title = undefined,
		description = undefined,
		trigger,
		action,
		iconType = undefined
	}: Props = $props();
</script>

<Sheet.Root>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<span class="flex-1 lg:hidden">
				{@render trigger({ props })}
			</span>
		{/snippet}
	</Sheet.Trigger>
	<Sheet.Content
		side="bottom"
		onOpenAutoFocus={(e) => {
			e.preventDefault();
		}}
	>
		<div class="mx-auto flex w-full max-w-sm flex-col gap-2 p-4">
			<Sheet.Header class="p-0">
				{#if title}
					<Sheet.Title class="text-xl">
						<div class="flex flex-row items-center justify-center gap-2 md:justify-start">
							{#if iconType}
								<Icon type={iconType}></Icon>
							{/if}
							<span>{title}</span>
						</div>
					</Sheet.Title>
				{/if}
				{#if description}
					<Sheet.Description>{description}</Sheet.Description>
				{/if}
			</Sheet.Header>
			<div>
				{@render action()}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<Dialog.Root>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<span class="hidden flex-1 lg:block">
				{@render trigger({ props })}
			</span>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content
		onOpenAutoFocus={(e) => {
			e.preventDefault();
		}}
	>
		<div class="mx-auto flex w-full max-w-sm flex-col gap-2 p-4">
			<Dialog.Header class="p-0">
				{#if title}
					<Dialog.Title class="text-xl">
						<div class="flex flex-row items-center justify-center gap-2 md:justify-start">
							{#if iconType}
								<Icon type={iconType}></Icon>
							{/if}
							<span>{title}</span>
						</div>
					</Dialog.Title>
				{/if}
				{#if description}
					<Dialog.Description>{description}</Dialog.Description>
				{/if}
			</Dialog.Header>
			<div>
				{@render action()}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
