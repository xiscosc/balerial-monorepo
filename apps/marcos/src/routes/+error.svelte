<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Box from '@/components/generic/Box.svelte';
	import NotFoundImage from '@/images/404.svelte';
	import InternalServerError from '@/images/500.svelte';
	import Button from '@/components/generic/button/Button.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { ButtonAction } from '@/components/generic/button/button.enum';
</script>

<svelte:head>
	<title>Marcs i Moldures Son Sardina</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-[#F7F5F2]">
	<div class="flex min-h-screen w-full items-center justify-center">
		<div class="w-full px-3 md:w-1/2 md:px-0 lg:w-1/3">
			<Box>
				<div class="flex flex-col gap-2">
					<div class="flex w-full justify-center p-7">
						{#if page.status === 500}
							<InternalServerError />
						{:else}
							<NotFoundImage />
						{/if}
					</div>
					<div class="flex flex-col gap-4">
						<span class="text-center font-semibold">
							{#if page.status === 500}
								Ha ocurrido un error inesperado
							{:else}
								Página no encontrada
							{/if}
						</span>
						<Button icon={IconType.HOME} text="Volver al inicio" action={ButtonAction.LINK} link="/"
						></Button>
					</div>
				</div>
			</Box>
		</div>
	</div>
</div>
