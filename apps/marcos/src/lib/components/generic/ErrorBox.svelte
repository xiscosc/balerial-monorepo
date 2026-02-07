<script lang="ts">
	import Box from '@/components/generic/Box.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';

	interface Props {
		status: 'error' | 'not-found';
		errorInfo?: string;
	}

	let { status, errorInfo }: Props = $props();

	const networkErrorPatterns = ['fetch', 'network', 'timeout', 'dynamically imported module'];
	let connectionIssue = $derived(
		status === 'error' &&
			((browser && !navigator.onLine) ||
				(errorInfo != null &&
					networkErrorPatterns.some((p) => errorInfo!.toLowerCase().includes(p))))
	);
</script>

<div class="w-full px-3 md:w-1/2 md:px-0 lg:w-1/3">
	<Box>
		<div class="flex flex-col gap-2">
			<div class="flex w-full justify-center">
				{#if status === 'error'}
					<Icon type={connectionIssue ? IconType.OFFLINE : IconType.ERROR} size={IconSize.XXXXL} />
				{:else}
					<Icon type={IconType.NOT_FOUND} size={IconSize.XXXXL} />
				{/if}
			</div>
			<div class="flex flex-col gap-4">
				<span class="text-center font-semibold">
					{#if status === 'error'}
						{#if connectionIssue}
							Parece que tienes problemas de conexión. Comprueba tu internet e inténtalo de nuevo.
						{:else}
							Ha ocurrido un error inesperado
						{/if}
					{:else}
						Página no encontrada
					{/if}
				</span>

				{#if errorInfo}
					<div class="rounded bg-gray-100 p-3 font-mono text-xs text-gray-700">
						{errorInfo}
					</div>
				{/if}
				<MarcosButton icon={IconType.HOME} onclick={() => goto(resolve('/'))}>
					Volver al inicio
				</MarcosButton>
			</div>
		</div>
	</Box>
</div>
