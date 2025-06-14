let search = $state('');

export class SearchCustomerState {
	public static setSearchValue(value: string) {
		search = value;
	}

	public static getSearchValue() {
		return search;
	}
}
