<script lang="ts">
	import Box from '@/components/generic/Box.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import ChangelogItem from '@/components/business-related/config/ChangelogItem.svelte';
	import { Changelogs } from '@/data/changelog';
	import Icon from '@/components/generic/icon/Icon.svelte';
	import type { Changelog } from '@/type/changelog.type';

	const orderedLogs: Changelog[] = [...Changelogs].reverse();
</script>

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.CHANGELOG}>Historial de cambios</SimpleHeading>
	<Box title="Detalle de los cambios">
		<div class="w-full space-y-2">
			{#each orderedLogs as changeLog, index (changeLog.title)}
				<ChangelogItem
					open={index === 0}
					title={changeLog.title}
					items={changeLog.items}
					version={changeLog.version}
				/>
			{/each}
		</div>
	</Box>
	<div class="rounded-lg border p-2 text-xs">
		<ul class="flex flex-wrap items-center gap-x-4 gap-y-2">
			<li><span class="font-bold">Leyenda:</span></li>
			<li class="flex items-center gap-1">
				<Icon type={IconType.NEW_BOX}></Icon>
				<span>Nuevas características</span>
			</li>
			<li class="flex items-center gap-1">
				<Icon type={IconType.SECURITY}></Icon>
				<span>Mejoras de seguridad</span>
			</li>
			<li class="flex items-center gap-1">
				<Icon type={IconType.MESSAGE}></Icon>
				<span>Cambios menores</span>
			</li>
			<li class="flex items-center gap-1">
				<Icon type={IconType.TOOL}></Icon>
				<span>Cambios técnicos</span>
			</li>
		</ul>
	</div>
</div>
