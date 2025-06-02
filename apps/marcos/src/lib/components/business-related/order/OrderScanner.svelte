<script lang="ts">
	import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
	import { onMount, onDestroy } from 'svelte';

	let html5QrCode: Html5Qrcode;
	const config = { fps: 10, qrbox: { width: 250, height: 250 } };

	interface Props {
		scannedText?: string;
	}

	let { scannedText = $bindable(undefined) }: Props = $props();

	onMount(() => {
		html5QrCode = new Html5Qrcode('reader');
		html5QrCode.start({ facingMode: 'environment' }, config, onScanSuccess, undefined);
	});

	onDestroy(() => {
		if (html5QrCode && html5QrCode.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
			html5QrCode
				.stop()
				.then(() => {})
				.catch(() => {});
		}
	});

	function onScanSuccess(decodedText: string) {
		html5QrCode
			.stop()
			.then(() => {
				scannedText = decodedText;
			})
			.catch(() => {});
	}
</script>

<div id="reader" class="w-[350px]"></div>
