<script lang="ts">
	import type { PageData } from './$types';
	import { ButtonStyle, ButtonType } from '@/components/generic/button/button.enum';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data }: { data: PageData } = $props();
</script>

<div
	class="flex w-full flex-col place-content-center items-center justify-center gap-4 py-2 md:grid md:grid-cols-2 lg:grid-cols-3"
>
	<MarcosButton
		onclick={() => {
			goto(resolve('/external/orders/new'));
		}}
		size={ButtonType.HOME}
		iconSize={IconSize.BIG}
		icon={IconType.FORM}
		variant={ButtonStyle.FORM}
	>
		Crear nota
	</MarcosButton>
</div>

<div class="flex flex-row items-center justify-center pt-3">
	<span class="text-xs text-gray-500">
		{`Tienda externa: ${data.storeName}`}
	</span>
</div>
