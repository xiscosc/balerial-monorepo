<script lang="ts">
	import { Toaster, toast } from 'svelte-sonner';
	import Box from '@/components/generic/Box.svelte';
	import Button from '@/components/generic/button/Button.svelte';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import Banner from '@/components/generic/Banner.svelte';
	import { Input } from '@/components/ui/input';
	import Progress from '@/components/ui/progress/progress.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { PriceApiGateway } from '@/gateway/price-api.gateway';

	let files: FileList | undefined = $state();
	let loadingText = $state('');
	let loading = $state(false);
	let loadingProgress = $state(0);

	async function loadFile() {
		if (validFile() && files != null) {
			const { filename, url } = await PriceApiGateway.getUploadMoldParams();
			const file = files![0];
			loading = true;
			loadingText = 'Cargando archivo...';
			animateToFull(0, 20, 'Procesando archivo...');
			const uploadResult = await uploadToS3(url, file);
			if (uploadResult) {
				animateToFull(20, 85, 'Extrayendo precios...');
				const processingResult = await startProcessing(filename);
				animateToFull(85, 100, 'Carga completa', true);
				if (processingResult) {
					toast.success('Precios actualizados correctamente');
				}
			} else {
				cleanUpload();
			}
		}
	}

	function animateToFull(
		start: number,
		end: number,
		finishText: string,
		finishLoading: boolean = false
	) {
		loadingProgress = start; // Reset progress
		const interval = setInterval(() => {
			loadingProgress += 1; // Increment progress
			if (loadingProgress >= end) {
				clearInterval(interval); // Stop animation at 100%
				loadingText = finishText;
				if (finishLoading) {
					cleanUpload();
				}
			}
		}, 85); // Adjust the speed (20ms for smoother animation)
	}

	function cleanUpload() {
		files = undefined;
		loadingText = '';
		loading = false;
	}

	function validFile(): boolean {
		if (files == null || files.length !== 1) {
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

<Toaster richColors />

<div class="flex flex-col gap-4">
	<SimpleHeading icon={IconType.MOLD}>Carga de precios de Marcos/Molduras</SimpleHeading>
	<Box>
		<div class="flex flex-col gap-2">
			<Banner
				title="Formato del archivo"
				icon={IconType.QUESTION}
				text="Columna A: Casillero, Columna B: Referencia, Columna C: Precio, Columna D: Flotante (casilla igual a S)"
				color="indigo"
			/>
			<div
				class="flex w-full flex-col place-content-center items-center justify-center space-y-4 px-2 py-4"
			>
				{#if loading}
					<div class="flex w-full flex-col items-center gap-2">
						<span class="font-medium">{loadingText}</span>
						<Progress value={loadingProgress} />
					</div>
				{:else}
					<Input id="moldFile" type="file" bind:files />
					<Button text="Cargar archivo excel" icon={IconType.EXCEL} onClick={loadFile}></Button>
				{/if}
			</div>
		</div>
	</Box>
</div>
