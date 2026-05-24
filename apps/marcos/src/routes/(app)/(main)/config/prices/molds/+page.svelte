<script lang="ts">
	import { toast } from 'svelte-sonner';
	import Box from '@/components/generic/Box.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import FilePicker from '@/components/generic/FilePicker.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { PriceApiGateway } from '@/gateway/price-api.gateway';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import ProgressBar from '@/components/generic/ProgressBar.svelte';

	const phaseTexts: Record<number, string> = {
		20: 'Procesando archivo...',
		85: 'Extrayendo precios...',
		100: 'Carga completa'
	};

	let files: File[] = $state([]);
	let loadingText = $state('');
	let loading = $state(false);
	let progressTarget = $state(0);

	async function loadFile() {
		if (validFile()) {
			const { filename, url } = await PriceApiGateway.getUploadMoldParams();
			const file = files[0];
			loading = true;
			loadingText = 'Cargando archivo...';
			progressTarget = 20;
			const uploadResult = await uploadToS3(url, file);
			if (uploadResult) {
				progressTarget = 85;
				const processingResult = await startProcessing(filename);
				progressTarget = 100;
				if (processingResult) {
					toast.success('Precios actualizados correctamente');
				}
			} else {
				cleanUpload();
			}
		}
	}

	function handleProgressComplete(value: number) {
		if (phaseTexts[value]) loadingText = phaseTexts[value];
		if (value === 100) setTimeout(cleanUpload, 1500);
	}

	function cleanUpload() {
		files = [];
		loadingText = '';
		loading = false;
		progressTarget = 0;
	}

	function validFile(): boolean {
		if (files.length !== 1) {
			toast.error('Por favor, seleccione un archivo');
			return false;
		} else {
			const file = files[0];
			const fileExtension = file.name.split('.').pop()?.toLowerCase() ?? '';
			const validExtensions = ['xls', 'xlsx'];

			if (!validExtensions.includes(fileExtension)) {
				toast.error('Por favor, seleccione un archivo Excel (.xls o .xlsx)');
				cleanUpload();
				return false;
			}
		}

		return true;
	}

	async function startProcessing(filename: string): Promise<boolean> {
		try {
			const processingResult = await PriceApiGateway.triggerMoldProcessing(filename);
			if (processingResult) {
				return true;
			} else {
				toast.error(
					'Ocurrió un error al procesar el archivo. Puede deberse a un error de formato.'
				);
				return false;
			}
		} catch {
			toast.error('Ocurrió un error al procesar el archivo. Puede deberse a un error de formato.');
			return false;
		}
	}

	async function uploadToS3(presignedUrl: string, file: File): Promise<boolean> {
		try {
			const response = await fetch(presignedUrl, {
				method: 'PUT',
				body: file
			});

			if (response.ok) {
				return true;
			} else {
				toast.error('Ocurrió un error al cargar el archivo. Por favor, intente nuevamente.');
				return false;
			}
		} catch {
			toast.error('Ocurrió un error al cargar el archivo. Por favor, intente nuevamente.');
			return false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.MOLD}>Carga de precios de Marcos/Molduras</SimpleHeading>
	<Box>
		<div class="flex flex-col gap-4">
			{#if loading}
				<ProgressBar text={loadingText} value={progressTarget} oncomplete={handleProgressComplete} />
			{:else}
				<FilePicker
					bind:files
					accept=".xls,.xlsx"
					helperText="Formato .xls o .xlsx — Columnas: A Casillero · B Referencia · C Precio · D Flotante (S si flota)"
				/>
				<MarcosButton icon={IconType.EXCEL} onclick={loadFile}>Cargar archivo excel</MarcosButton>
			{/if}
		</div>
	</Box>
</div>
