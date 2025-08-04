<script lang="ts">
	import Box from '@/components/generic/Box.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import ChangelogItem from '@/components/business-related/config/ChangelogItem.svelte';
	import changeLogs from '@/data/changelog.json';

	const orderedLogs = [...changeLogs].reverse();
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
</div>
