<script lang="ts">
	import Box from '@/components/generic/Box.svelte';
	import { ButtonAction } from '@/components/generic/button/button.enum';
	import Button from '@/components/generic/button/Button.svelte';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import Icon from '@/components/generic/icon/Icon.svelte';

	interface Props {
		status: 'error' | 'not-found';
		errorInfo?: string;
	}

	let { status, errorInfo }: Props = $props();
</script>

<div class="w-full px-3 md:w-1/2 md:px-0 lg:w-1/3">
	<Box>
		<div class="flex flex-col gap-2">
			<div class="flex w-full justify-center">
				{#if status === 'error'}
					<Icon type={IconType.ERROR} size={IconSize.XXXXL} />
				{:else}
					<Icon type={IconType.NOT_FOUND} size={IconSize.XXXXL} />
				{/if}
			</div>
			<div class="flex flex-col gap-4">
				<span class="text-center font-semibold">
					{#if status === 'error'}
						Ha ocurrido un error inesperado
					{:else}
						Página no encontrada
					{/if}
				</span>
				{#if errorInfo}
					<div
						class="rounded bg-gray-100 p-3 font-['Google_Sans_Code',_monospace] text-xs text-gray-700"
					>
						{errorInfo}
					</div>
				{/if}
				<Button icon={IconType.HOME} text="Volver al inicio" action={ButtonAction.LINK} link="/"
				></Button>
			</div>
		</div>
	</Box>
</div>
