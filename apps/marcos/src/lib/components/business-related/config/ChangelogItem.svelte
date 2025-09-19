<script lang="ts">
	import * as Collapsible from '@/components/ui/collapsible';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { ChangelogItemType, type ChangelogItem } from '@/type/changelog.type';

	interface Props {
		title: string;
		items: ChangelogItem[];
		version: string | number;
		open?: boolean;
	}

	let { title, items, version, open: initialOpen = false }: Props = $props();
	let open = $state(initialOpen);

	const iconMap: Record<ChangelogItemType, IconType> = {
		[ChangelogItemType.NEW]: IconType.NEW_BOX,
		[ChangelogItemType.SECURITY]: IconType.SECURITY,
		[ChangelogItemType.MINOR_CHANGE]: IconType.MESSAGE,
		[ChangelogItemType.TECHNICAL]: IconType.TOOL
	};
</script>

<div class="mb-3">
	<Collapsible.Root
		bind:open
		class="group overflow-hidden rounded-md border border-gray-300 bg-white transition-all duration-200 hover:border-gray-300"
	>
		<Collapsible.Trigger
			class="flex w-full items-center justify-between px-6 py-4 text-left font-medium text-gray-900 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white"
		>
			<div class="flex items-center gap-3">
				<span class="text-md font-semibold tracking-tight">{title}</span>
				<span
					class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 font-mono text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300"
				>
					v{version}
				</span>
			</div>
			<div
				class="flex items-center justify-center rounded-full border border-gray-700 bg-gray-100 p-2 transition-all duration-200 group-hover:scale-105 group-hover:bg-gray-200"
			>
				<Icon type={open ? IconType.DOWN : IconType.RIGHT} />
			</div>
		</Collapsible.Trigger>
		<Collapsible.Content class="border-t border-gray-100">
			<div class="bg-gradient-to-r from-gray-50/80 to-gray-50/40 px-6 py-5">
				<ul class="space-y-4">
					{#each items as item (item)}
						<li class="group/item flex items-start gap-4">
							<div
								class="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 transition-all duration-200 group-hover/item:scale-110"
							></div>
							<span
								class="flex flex-row gap-2 text-sm font-medium leading-relaxed tracking-wide text-gray-800"
							>
								<Icon type={iconMap[item.type]}></Icon>
								{item.text}
							</span>
						</li>
					{/each}
				</ul>
			</div>
		</Collapsible.Content>
	</Collapsible.Root>
</div>
