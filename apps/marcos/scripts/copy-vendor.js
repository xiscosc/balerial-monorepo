import { copyFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';


const files = [
	{
		src: 'node_modules/@m3e/core/dist/index.min.js',
		dest: 'static/vendor/@m3e/core/index.min.js'
	},
	{
		src: 'node_modules/@m3e/core/dist/index.min.js.map',
		dest: 'static/vendor/@m3e/core/index.min.js.map'
	},
	{
		src: 'node_modules/@m3e/progress-indicator/dist/index.min.js',
		dest: 'static/vendor/@m3e/progress-indicator/index.min.js'
	},
	{
		src: 'node_modules/@m3e/progress-indicator/dist/index.min.js.map',
		dest: 'static/vendor/@m3e/progress-indicator/index.min.js.map'
	}
];

files.forEach(({ src, dest }) => {
	mkdirSync(dirname(dest), { recursive: true });
	copyFileSync(src, dest);
	console.log(`✓ Copied ${src} to ${dest}`);
});
