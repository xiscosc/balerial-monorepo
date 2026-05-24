<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Box from '@/components/generic/Box.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { ButtonVariant, ButtonTextVariant } from '@/components/generic/button/button.enum';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import ChangelogItem from '@/components/business-related/config/ChangelogItem.svelte';
	import { Changelogs } from '@/data/changelog';

	const orderedLogs = Changelogs.slice(-2).reverse();
</script>

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.SETTINGS}>Configuración de la aplicación</SimpleHeading>
	<Box title="Precios">
		<div
			class="flex w-full flex-col place-content-center items-center justify-center gap-4 p-2 md:grid md:grid-cols-2 lg:grid-cols-3"
		>
			<MarcosButton
				onclick={() => goto(resolve('/config/prices/molds'))}
				icon={IconType.MOLD}
				variant={ButtonVariant.NEUTRAL}
			>
				Cargar molduras
			</MarcosButton>

			<MarcosButton
				onclick={() => goto(resolve('/config/prices/new'))}
				icon={IconType.COINS}
				variant={ButtonVariant.FORM}
			>
				Nuevo precio
			</MarcosButton>

			<MarcosButton
				onclick={() => goto(resolve('/config/prices/list'))}
				icon={IconType.LIST}
				variant={ButtonVariant.ORDER_GENERIC}
				textVariant={ButtonTextVariant.GRAY}
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
				variant={ButtonVariant.NEUTRAL}
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
					variant={ButtonVariant.NEUTRAL}
					textVariant={ButtonTextVariant.WHITE}
				>
					Ver todos los cambios
				</MarcosButton>
			</div>
		</div>
	</Box>
</div>
