<script lang="ts">
	import { goto } from '$app/navigation';
	import Box from '@/components/generic/Box.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import Button from '@/components/generic/button/Button.svelte';
	import { ButtonStyle, ButtonText } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import ChangelogItem from '@/components/business-related/config/ChangelogItem.svelte';

	let tapCount = 0;
	let tapTimer: ReturnType<typeof setTimeout> | null = null;
	const requiredTaps = 7;
	const tapTimeout = 1500;

	const changeLogs = [
		{
			version: 20250704,
			title: 'Julio 2025',
			items: [
				'Mejoras de seguridad',
				'Actualización del sistema',
				'Nueva fórmula: m2 * precio * iva * 12 + 2',
				'Cambio de usuario al crear un pedido desde un presupuesto'
			]
		},
		{
			version: 20250615,
			title: 'Junio 2025',
			items: [
				'Mejoras de seguridad',
				'Mejoras de rendimiento al crear pedidos',
				'Actualización del sistema'
			]
		}
	].sort((a, b) => b.version - a.version);

	function handleHeadingTap() {
		tapCount++;

		if (tapTimer) {
			clearTimeout(tapTimer);
		}

		if (tapCount >= requiredTaps) {
			tapCount = 0;
			goto('/config/debug');
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
		on:click={handleHeadingTap}
		on:keydown={handleKeyDown}
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
			<Button
				link="/config/prices/molds"
				text="Cargar molduras"
				icon={IconType.MOLD}
				style={ButtonStyle.NEUTRAL}
			></Button>

			<Button
				link="/config/prices/new"
				text="Nuevo precio"
				icon={IconType.COINS}
				style={ButtonStyle.FORM}
			></Button>

			<Button
				link="/config/prices/list"
				text="Lista de precios"
				icon={IconType.LIST}
				style={ButtonStyle.ORDER_GENERIC}
				textType={ButtonText.GRAY}
			></Button>
		</div>
	</Box>

	<Box title="Pedidos">
		<div
			class="flex w-full flex-col place-content-center items-center justify-center gap-4 p-2 md:grid md:grid-cols-2 lg:grid-cols-3"
		>
			<Button
				link="/config/orders/locations"
				text="Editar ubicaciones"
				style={ButtonStyle.NEUTRAL}
				icon={IconType.LOCATION}
			></Button>
		</div>
	</Box>

	<Box title="Cambios">
		<div class="w-full space-y-2">
			{#each changeLogs as changeLog, index (changeLog.title)}
				<ChangelogItem
					open={index === 0}
					title={changeLog.title}
					items={changeLog.items}
					version={changeLog.version}
				/>
			{/each}
		</div>
	</Box>
</div>
