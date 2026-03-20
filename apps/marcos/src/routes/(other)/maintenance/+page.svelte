<script lang="ts">
	import Icon from '@/components/generic/icon/Icon.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import { asset } from '$app/paths';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';

	onMount(() => {
		const interval = setInterval(() => {
			invalidateAll();
		}, 30_000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex min-h-screen w-full items-center justify-center px-4">
	<div class="flex w-full max-w-md flex-col items-center gap-8 rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
		<img class="w-28" src={asset('/mmlogo.png')} alt="Marcos App" />

		<div class="flex flex-col items-center gap-3 text-center">
			<div class="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
				<Icon type={IconType.TOOL} size={IconSize.XL} />
			</div>
			<h1 class="text-2xl font-semibold text-gray-900">Fuera de servicio</h1>
			<p class="text-gray-500">
				La aplicación se encuentra en mantenimiento. Se reestablecerá el servicio lo antes
				posible.
			</p>
		</div>

		<span class="text-sm text-gray-400">Marcos App</span>
	</div>
</div>
