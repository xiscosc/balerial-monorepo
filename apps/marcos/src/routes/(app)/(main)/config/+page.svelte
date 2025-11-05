<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Box from '@/components/generic/Box.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import ChangelogItem from '@/components/business-related/config/ChangelogItem.svelte';
	import { Changelogs } from '@/data/changelog';

	let tapCount = 0;
	let tapTimer: ReturnType<typeof setTimeout> | null = null;
	const requiredTaps = 7;
	const tapTimeout = 1500;
	const orderedLogs = Changelogs.slice(-2).reverse();

	function handleHeadingTap() {
		tapCount++;

		if (tapTimer) {
			clearTimeout(tapTimer);
		}

		if (tapCount >= requiredTaps) {
			tapCount = 0;
			goto(resolve('/config/debug'));
		} else {
			tapTimer = setTimeout(() => {
				tapCount = 0;
			}, tapTimeout);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			handleHeadingTap();
		}
	}
</script>

<div class="flex flex-col gap-4">
	<div
		onclick={handleHeadingTap}
		onkeydown={handleKeyDown}
		role="button"
		tabindex="0"
		class="cursor-defaul"
		title=""
	>
		<SimpleHeading icon={IconType.SETTINGS}>Configuración de la aplicación</SimpleHeading>
	</div>
	<Box title="Precios">
		<div
			class="flex w-full flex-col place-content-center items-center justify-center gap-4 p-2 md:grid md:grid-cols-2 lg:grid-cols-3"
		>
			<MarcosButton
				onclick={() => goto(resolve('/config/prices/molds'))}
				icon={IconType.MOLD}
				variant={ButtonStyle.NEUTRAL}
			>
				Cargar molduras
			</MarcosButton>

			<MarcosButton
				onclick={() => goto(resolve('/config/prices/new'))}
				icon={IconType.COINS}
				variant={ButtonStyle.FORM}
			>
				Nuevo precio
			</MarcosButton>

			<MarcosButton
				onclick={() => goto(resolve('/config/prices/list'))}
				icon={IconType.LIST}
				variant={ButtonStyle.ORDER_GENERIC}
				textVariant={ButtonText.GRAY}
			>
				Lista de precios
			</MarcosButton>
		</div>
	</Box>

	<Box title="Pedidos">
		<div
			class="flex w-full flex-col place-content-center items-center justify-center gap-4 p-2 md:grid md:grid-cols-2 lg:grid-cols-3"
		>
			<MarcosButton
				onclick={() => goto(resolve('/config/orders/locations'))}
				variant={ButtonStyle.NEUTRAL}
				icon={IconType.LOCATION}
			>
				Editar ubicaciones
			</MarcosButton>
		</div>
	</Box>

	<Box title="Cambios">
		<div class="w-full space-y-2">
			{#each orderedLogs as changeLog, index (changeLog.title)}
				<ChangelogItem
					open={index === 0}
					title={changeLog.title}
					items={changeLog.items}
					version={changeLog.version}
				/>
			{/each}
			<div class="flex justify-center pt-2">
				<MarcosButton
					onclick={() => goto(resolve('/config/changelog'))}
					icon={IconType.CHANGELOG}
					variant={ButtonStyle.NEUTRAL}
					textVariant={ButtonText.WHITE}
				>
					Ver todos los cambios
				</MarcosButton>
			</div>
		</div>
	</Box>
</div>
