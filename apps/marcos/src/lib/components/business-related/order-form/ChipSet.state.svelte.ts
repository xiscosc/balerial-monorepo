import { SvelteMap } from 'svelte/reactivity';

interface ChipSetState {
	selectedValues: string[];
	isSelected: (value: string) => boolean;
	toggle: (value: string) => void;
}

export class ChipSetStateClass implements ChipSetState {
	private filledList: SvelteMap<string, boolean> = $state(new SvelteMap());
	public selectedValues: string[] = $derived(
		Array.from(this.filledList.entries())
			.filter(([_, filled]) => filled)
			.map(([value]) => value)
	);

	constructor(values: string[], initialSelectedValues: string[]) {
		values.forEach((value) => {
			this.filledList.set(value, initialSelectedValues.includes(value));
		});
	}

	public toggle(value: string) {
		this.filledList.set(value, !this.isSelected(value));
	}

	public isSelected(value: string): boolean {
		return this.filledList.get(value)!;
	}
}
