<script lang="ts">
	import type { PageData } from './$types';
	import { toast } from 'svelte-sonner';
	import {
		FileType,
		ImageVariant,
		type File as MMSSFile
	} from '@marcsimolduressonsardina/core/type';
	import { ImageConverter } from '@/images/image-converter';
	import Loading from '@/components/generic/Loading.svelte';
	import UploadedFile from '@/components/business-related/file/UploadedFile.svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { IconType } from '@/components/generic/icon/icon.enum';
	import MarcosButton from '@/components/generic/button/MarcosButton.svelte';
	import { ButtonSize } from '@/components/generic/button/button.enum';
	import Box from '@/components/generic/Box.svelte';
	import SimpleHeading from '@/components/generic/SimpleHeading.svelte';
	import { Input } from '@/components/ui/input';
	import Photos from '@/components/business-related/file/Photos.svelte';
	import { trackEvent, isFeatureEnabled } from '@/shared/fronted-analytics/posthog';
	import { OrderApiGateway } from '@/gateway/order-api.gateway';
	import { getGlobalProfiler } from '@/state/profiler/profiler.state';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let inputFiles: FileList | undefined = $state();
	let loading = $state(false);
	let uploading = $state(false);
	let loadingText = $state('');

	let profiledFiles: Promise<MMSSFile[]> = getGlobalProfiler().measure(
		data.files ?? new Promise(() => [])
	);

	let loadingFiles = $state(true);
	let files: MMSSFile[] = $state([]);

	profiledFiles
		.then((f: MMSSFile[]) => {
			files = f;
		})
		.finally(() => {
			loadingFiles = false;
		});

	let photos = $derived(files.filter((f) => f.type === FileType.PHOTO));
	let videos = $derived(files.filter((f) => f.type === FileType.VIDEO));
	let other = $derived(files.filter((f) => f.type === FileType.OTHER));
	let noArt = $derived(files.filter((f) => f.type === FileType.NO_ART));

	async function deleteFile(id: string) {
		loadingText = 'Eliminando archivo, por favor no cierre la ventana';
		loading = true;
		try {
			await OrderApiGateway.deleteOrderFile(data!.order!.id, id);
		} catch {
			toast.error('Error al eliminar el fichero');
			loading = false;
			return;
		}

		loading = false;
		files = files.filter((f) => f.id != id);
	}

	async function createNoArtFile() {
		loadingText = 'Cargando archivo, por favor no cierre la ventana';
		loading = true;
		try {
			const file = await OrderApiGateway.createOrderFile(
				data!.order!.id,
				'Sin obra',
				FileType.NO_ART
			);
			files = [...files, file];
		} catch {
			toast.error('Error al procesar el fichero');
		}

		loading = false;
	}

	async function createFile(
		filename: string,
		imageVariant?: ImageVariant
	): Promise<MMSSFile | undefined> {
		try {
			const file = await OrderApiGateway.createOrderFile(
				data!.order!.id,
				filename,
				undefined,
				imageVariant
			);
			return file;
		} catch {
			toast.error('Error al procesar el fichero');
		}
	}

	async function getFile(id: string): Promise<MMSSFile | undefined> {
		try {
			const file = await OrderApiGateway.getOrderFile(data!.order!.id, id);
			return file;
		} catch {
			toast.error('Error al obtener el fichero');
		}
	}

	async function loadFile() {
		if (inputFiles == null || inputFiles.length === 0) {
			toast.error('Debes seleccionar un archivo');
			return;
		}

		uploading = true;
		loadingText = 'Preparando archivos';
		const filesToUpload = [...inputFiles];
		const total = filesToUpload.length;
		const optimizeImages = isFeatureEnabled('optimize-images');
		let hasErrors = false;

		for (let i = 0; i < total; i++) {
			const current = i + 1;
			const f = filesToUpload[i];
			const shouldOptimize = optimizeImages && ImageConverter.isImageFile(f);

			let fileToUpload: File = f;
			let imageVariant: ImageVariant | undefined;
			const label = ImageConverter.isImageFile(f) ? 'imagen' : 'archivo';

			if (shouldOptimize) {
				loadingText = `Optimizando imagen ${current} de ${total}`;
				fileToUpload = await ImageConverter.convertImage(f);
				imageVariant = ImageVariant.OPTIMIZED;
			}

			loadingText = `Cargando ${label} ${current} de ${total}`;
			const result = await uploadIndividualFile(fileToUpload, imageVariant, (p) => {
				loadingText = `Cargando ${label} ${current} de ${total} (${p}%)`;
			});

			if (result != null) {
				files = [...files, result];
			} else {
				hasErrors = true;
			}
		}

		inputFiles = undefined;
		uploading = false;

		if (hasErrors) {
			toast.error('Algunos archivos no pudieron cargarse');
		}
	}

	async function uploadIndividualFile(
		fileToUpload: File,
		imageVariant: ImageVariant | undefined,
		onProgress: (p: number) => void
	): Promise<MMSSFile | undefined> {
		const file = await createFile(fileToUpload.name, imageVariant);
		if (file == null) return;
		await uploadToS3(file.uploadUrl!, fileToUpload, onProgress);
		return getFile(file.id);
	}

	async function uploadToS3(
		presignedUrl: string,
		file: File,
		onProgress: (p: number) => void
	): Promise<boolean> {
		return new Promise((resolve) => {
			const xhr = new XMLHttpRequest();
			xhr.open('PUT', presignedUrl, true);

			xhr.upload.onprogress = (event) => {
				if (event.lengthComputable) {
					onProgress(Math.round((event.loaded / event.total) * 100));
				}
			};

			xhr.onload = () => {
				onProgress(100);
				resolve(xhr.status >= 200 && xhr.status < 300);
			};

			xhr.onerror = () => {
				toast.error('Ocurrió un error al cargar el archivo. Por favor, intente nuevamente.');
				resolve(false);
			};

			xhr.send(file);
		});
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex w-full flex-row items-end justify-between">
		<SimpleHeading icon={IconType.CAMERA}>Archivos y fotos</SimpleHeading>

		{#if !(loading || uploading) && data.order}
			<div>
				<MarcosButton
					icon={IconType.ORDER_PICKED_UP}
					onclick={() => goto(resolve(`/(app)/(main)/orders/[id]`, { id: data.order.id }))}
					size={ButtonSize.SMALL}
				>
					Volver al pedido
				</MarcosButton>
			</div>
		{/if}
	</div>

	{#if loading}
		<Box>
			<Loading text={loadingText} />
		</Box>
	{/if}
	{#if uploading}
		<Box>
			<Loading text={loadingText} />
		</Box>
	{/if}

	{#if !loading && !uploading}
		<div class="flex flex-col gap-2">
			<Box title="Carga de archivos">
				<div class="flex flex-col gap-2 md:flex-row">
					<Input type="file" bind:files={inputFiles} onchange={loadFile} multiple />
				</div>
			</Box>

			{#if loadingFiles}
				<Box>
					<Loading text="Cargando archivos" />
				</Box>
			{:else}
				{#if files.length === 0}
					<Box title="Sin Obra">
						<div class="flex flex-col gap-2 md:flex-row">
							<MarcosButton
								onclick={() => {
									createNoArtFile();
									trackEvent('No art file created', { orderId: data.order?.id });
								}}
								icon={IconType.ADD}
							>
								Añadir archivo Sin Obra
							</MarcosButton>
						</div>
					</Box>
				{/if}

				{#if photos.length > 0}
					<Box title="Fotos" collapsible>
						<Photos files={photos} deleteFunction={deleteFile} />
					</Box>
				{/if}

				{#if videos.length > 0}
					<Box title="Vídeos" collapsible>
						<div class="flex flex-col gap-2">
							{#each videos as file (file.id)}
								<UploadedFile
									fileType={FileType.VIDEO}
									fileName={file.originalFilename}
									downloadUrl={file.downloadUrl}
									onDelete={deleteFile}
									id={file.id}
								/>
							{/each}
						</div>
					</Box>
				{/if}

				{#if other.length > 0 || noArt.length > 0}
					<Box title="Otros archivos" collapsible>
						<div class="flex flex-col gap-2">
							{#each other as file (file.id)}
								<UploadedFile
									fileType={file.type}
									fileName={file.originalFilename}
									downloadUrl={file.downloadUrl}
									onDelete={deleteFile}
									id={file.id}
								/>
							{/each}
							{#each noArt as file (file.id)}
								<UploadedFile
									fileType={file.type}
									fileName={file.originalFilename}
									onDelete={deleteFile}
									id={file.id}
								/>
							{/each}
						</div>
					</Box>
				{/if}
			{/if}
		</div>
	{/if}
</div>
