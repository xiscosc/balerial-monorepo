import { browser } from '$app/environment';
import { toast } from 'svelte-sonner';

let initialized = false;

export function initNetworkStatus() {
	if (!browser || initialized) return;
	initialized = true;

	window.addEventListener('offline', () => {
		toast.warning('Error de conexión. Comprueba tu internet.');
	});

	window.addEventListener('online', () => {
		toast.success('Conexión restaurada. ¡Todo listo!');
	});
}
