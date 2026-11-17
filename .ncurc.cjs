// apps/marcos pins typescript@6 only for svelte-check's .svelte transpile (TS 7 runs via @typescript/native); never bump it to 7.
module.exports = {
	filterResults: (name, { currentVersionSemver, upgradedVersionSemver }) =>
		!(
			name === 'typescript' &&
			currentVersionSemver?.[0]?.major === '6' &&
			upgradedVersionSemver?.major !== '6'
		)
};
