<script lang="ts">
	import { ButtonStyle, ButtonText, ButtonType } from '@/components/generic/button/button.enum';
	import { IconSize, IconType } from '@/components/generic/icon/icon.enum';
	import { Changelogs } from '@/data/changelog';
	import type { Changelog } from '@/type/changelog.type';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';

	const lastChange: Changelog = Changelogs.slice(-1)[0];
</script>

<div
	class="flex w-full flex-col place-content-center items-center justify-center gap-4 py-2 md:grid md:grid-cols-2 lg:grid-cols-3"
>
	<MarcosButton
		icon={IconType.SEARCH}
		iconSize={IconSize.BIG}
		size={ButtonType.HOME}
		variant={ButtonStyle.CUSTOMER}
		onclick={() => {
			goto(resolve('/customers/search'));
		}}
	>
		Buscar cliente
	</MarcosButton>

	<MarcosButton
		icon={IconType.LIST}
		iconSize={IconSize.BIG}
		size={ButtonType.HOME}
		variant={ButtonStyle.ORDER_GENERIC}
		textVariant={ButtonText.GRAY}
		onclick={() => {
			goto(resolve('/orders/list'));
		}}
	>
		Listado pedidos
	</MarcosButton>

	<MarcosButton
		icon={IconType.ORDER_QUOTE}
		iconSize={IconSize.BIG}
		size={ButtonType.HOME}
		variant={ButtonStyle.ORDER_QUOTE}
		onclick={() => {
			goto(resolve('/orders/list?status=quote'));
		}}
	>
		Listado de presupuestos
	</MarcosButton>

	<MarcosButton
		icon={IconType.QR}
		iconSize={IconSize.BIG}
		size={ButtonType.HOME}
		variant={ButtonStyle.NEUTRAL}
		onclick={() => {
			goto(resolve('/orders/scan'));
		}}
	>
		Escanear resguardo
	</MarcosButton>

	<MarcosButton
		icon={IconType.FORM}
		iconSize={IconSize.BIG}
		size={ButtonType.HOME}
		variant={ButtonStyle.FORM}
		onclick={() => {
			goto(resolve('/orders/new'));
		}}
	>
		Crear nota
	</MarcosButton>
</div>

<div class="flex flex-row items-center justify-center pt-3">
	<span class="text-xs text-gray-500">
		Tienda principal <span class="font-semibold">({lastChange.version})</span>
	</span>
</div>
