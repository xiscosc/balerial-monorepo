<script lang="ts">
	import QRCode from 'qrcode';
	import type { QRCodeRenderersOptions } from 'qrcode';
	import { onMount } from 'svelte';

	let { size, qrData }: { size: number; qrData: string } = $props();

	const qrOptions: QRCodeRenderersOptions = {
		margin: 0,
		scale: 10,
		errorCorrectionLevel: 'Q'
	};

	let qrString: string | undefined = $state();

	onMount(async () => {
		qrString = await QRCode.toDataURL(qrData, qrOptions);
	});
</script>

{#if qrString}
	<div
		style="width: {size}px; height: {size}px; display: flex; justify-content: center; align-items: center;"
	>
		<img src={qrString} alt="qr" style="height: 100%; object-fit: contain;" />
	</div>
{/if}
