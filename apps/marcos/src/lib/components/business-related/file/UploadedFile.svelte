<script lang="ts">
	import Step from '@/components/generic/Step.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import { FileType } from '@marcsimolduressonsardina/core/type';
	import MarcosLink from '@/components/generic/button/MarcosLink.svelte';

	interface Props {
		id?: string;
		fileName?: string;
		downloadUrl?: string;
		onDelete?: (id: string) => Promise<void>;
		fileType: FileType;
	}

	let {
		id = '',
		fileName = '',
		downloadUrl = undefined,
		fileType,
		onDelete = undefined
	}: Props = $props();

	async function deleteFile() {
		if (onDelete) {
			await onDelete(id);
		}
	}

	let subtitle = $derived(
		fileType === FileType.VIDEO
			? 'Vídeo'
			: fileType === FileType.NO_ART
				? 'Archivo por defecto'
				: 'Archivo'
	);
	let downloadIcon = $derived(fileType === FileType.VIDEO ? IconType.EYE : IconType.DOWNLOAD);
	let icon = $derived(
		fileType === FileType.VIDEO
			? IconType.VIDEO
			: fileType === FileType.NO_ART
				? IconType.CLOSE
				: IconType.DOCUMENT
	);
</script>

{#snippet downloadButton()}
	<MarcosLink
		icon={downloadIcon}
		target="_blank"
		href={downloadUrl}
		aria-disabled={downloadUrl == null}
	></MarcosLink>
{/snippet}

<Step
	{subtitle}
	{icon}
	title={fileName}
	showDelete={true}
	deleteFunction={deleteFile}
	otherAction={downloadButton}
	deleteConfirmation={true}
></Step>
