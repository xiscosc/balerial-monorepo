export enum ButtonStyle {
	WHATSAPP = 'bg-green-800 hover:bg-green-900  border',
	DISABLED = 'bg-gray-400 hover:bg-gray-500 focus:bg-gray-600 border border-gray-900',
	ORDER_FINISHED = 'bg-amber-600 hover:bg-amber-700 focus:bg-amber-500 border border-amber-900',
	ORDER_FINISHED_VARIANT = 'bg-amber-100 text-amber-700 hover:bg-amber-200 focus:bg-amber-200 border border-amber-700',
	DELETE = 'bg-red-700 hover:bg-red-800  border border-red-900',
	DELETE_VARIANT = 'bg-red-100 text-red-700 hover:bg-red-200 focus:bg-red-200 border border-red-700',
	SOFT_DELETE = 'bg-gray-300 hover:bg-gray-400  border border-gray-900',
	ORDER_PENDING = 'bg-blue-600 hover:bg-blue-700 focus:bg-blue-500 border border-blue-900',
	ORDER_PENDING_VARIANT = 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:bg-blue-200 border border-blue-700 ',
	ORDER_QUOTE = 'bg-purple-600 hover:bg-purple-700 focus:bg-purple-500 border border-purple-900',
	ORDER_QUOTE_VARIANT = 'bg-purple-100 text-purple-700 hover:bg-purple-200 focus:bg-purple-200 border border-purple-700',
	ORDER_GENERIC = 'bg-yellow-500 hover:bg-yellow-600 focus:bg-yellow-400 border border-yellow-900',
	ORDER_GENERIC_VARIANT = 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 focus:bg-yellow-200 border border-yellow-700',
	ORDER_PICKED_UP = 'bg-green-700 hover:bg-green-800  border border-green-900',
	ORDER_PICKED_UP_VARIANT = 'bg-green-100 text-green-700 hover:bg-green-200 focus:bg-green-200 border border-green-700',
	CUSTOMER = ORDER_PENDING,
	CUSTOMER_VARIANT = 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:bg-blue-200 border border-blue-700',
	NEUTRAL = 'bg-gray-800 hover:bg-gray-900 focus:bg-gray-700 border border-gray-900',
	NEUTRAL_VARIANT = 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:bg-gray-12000 border border-gray-700',
	FORM = 'bg-emerald-600 hover:bg-emmrald-800 focus:bg-emerald-500 border border-emerald-900'
}

export enum ButtonText {
	WHITE = 'text-white',
	GRAY = 'text-gray-800',
	NO_COLOR = 'font-semibold'
}

export enum ButtonType {
	DEFAULT = 'rounded-md px-4 py-2 text-center ',
	SMALL = 'rounded-md px-2 py-1 text-center focus:outline-hidden',
	HOME = 'w-full rounded-md px-6 py-4 text-left text-lg font-semibold '
}

export enum ButtonAction {
	CLICK = 'click',
	LINK = 'link',
	SUBMIT = 'submit',
	TRIGGER = 'trigger'
}
