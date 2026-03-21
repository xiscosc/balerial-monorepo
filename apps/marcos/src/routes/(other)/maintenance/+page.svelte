<script lang="ts">
	import Box from '@/components/generic/Box.svelte';
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

<div class="flex min-h-screen w-full items-center justify-center">
	<div class="w-full px-3 md:w-1/2 md:px-0 lg:w-1/3">
		<Box>
			<div class="flex flex-col items-center gap-6">
				<img class="w-52" src={asset('/mmlogo.png')} alt="Marcos App" />
				<div
					class="flex h-14 w-14 animate-[spin_3s_linear_infinite] items-center justify-center rounded-full border border-gray-700 bg-amber-200"
				>
					<Icon type={IconType.SETTINGS} size={IconSize.XL} />
				</div>
				<div class="flex flex-col gap-2">
					<span class="text-center font-semibold">Fuera de servicio</span>
					<span class="text-center text-sm text-gray-500">
						La aplicación se encuentra en mantenimiento. Se reestablecerá el servicio lo antes
						posible.
					</span>
				</div>
			</div>
		</Box>
	</div>
</div>
