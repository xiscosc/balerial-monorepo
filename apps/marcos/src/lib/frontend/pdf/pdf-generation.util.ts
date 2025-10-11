import { browser } from '$app/environment';

export class PdfGenerationUtil {
	public static async generatePdf(
		element: HTMLElement,
		fileName: string,
		format: 'A4' | 'A5',
		orientation: 'portrait' | 'landscape'
	) {
		if (browser) {
			// Load html2pdf from CDN if not already loaded
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const win = window as Window & { html2pdf?: any };
			if (!win.html2pdf) {
				await new Promise((resolve, reject) => {
					const script = document.createElement('script');
					script.type = 'application/javascript';
					script.src =
						'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
					script.onload = resolve;
					script.onerror = reject;
					document.head.appendChild(script);
				});
			}

			const html2pdf = win.html2pdf!;

			const opt = {
				margin: 0.1,
				filename: `${fileName}.pdf`,
				image: { type: 'jpeg' as const, quality: 0.98 },
				html2canvas: { scale: 2 },
				jsPDF: { unit: 'in' as const, format, orientation }
			};

			await html2pdf().set(opt).from(element).save();
		}
	}
}
