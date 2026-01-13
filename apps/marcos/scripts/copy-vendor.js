import { copyFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = [
	{
		src: 'node_modules/@m3e/core/dist/index.min.js',
		dest: 'static/vendor/@m3e/core/index.min.js'
	},
	{
		src: 'node_modules/@m3e/progress-indicator/dist/index.min.js',
		dest: 'static/vendor/@m3e/progress-indicator/index.min.js'
	}
];

files.forEach(({ src, dest }) => {
	mkdirSync(dirname(dest), { recursive: true });
	copyFileSync(src, dest);
	console.log(`✓ Copied ${src} to ${dest}`);
});
