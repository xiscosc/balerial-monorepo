interface PricingSelectorWithQuantitySectionState {
	isAdded: () => boolean;
	setIsAdded: (value: boolean) => void;
	add: (id: string | undefined, quantity: string | undefined) => boolean;
}

export class PricingSelectorWithQuantitySectionStateClass
	implements PricingSelectorWithQuantitySectionState
{
	private added: boolean = $state(false);

	constructor(private addCallback: (id: string, quantity: number) => void) {}

	public isAdded() {
		return this.added;
	}

	public setIsAdded(value: boolean) {
		this.added = value;
	}

	public add(id: string | undefined, quantity: string | undefined) {
		if (id != null && quantity != null) {
			this.addCallback(id, parseInt(quantity));
			return true;
		}
		return false;
	}
}
