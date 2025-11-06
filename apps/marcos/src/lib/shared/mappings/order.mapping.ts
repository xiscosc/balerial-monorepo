import { OrderStatus } from '@marcsimolduressonsardina/core/type';
import { BatchOperation } from '@/type/api.type';

export const customerMoldIds = ['2_MARCO DEL CLIENTE', '1_SIN MARCO'];

export const discountMap: Record<string, number> = {
	'0': 0,
	'1': 10,
	'2': 15,
	'20': 20,
	'25': 25,
	'30': 30,
	'50': 50,
	'100': 100
};

export const orderBatchOperationActionMap: Record<BatchOperation, string> = {
	[BatchOperation.SET_PAID]: 'Marcando pedidos como pagados',
	[BatchOperation.SET_INVOICED]: 'Marcando pedidos como facturados',
	[BatchOperation.SET_PICKED_UP]: 'Marcando pedidos como recogidos',
	[BatchOperation.NOTIFY_ORDERS]: 'Notificando pedidos'
};

export const orderBatchOperationTitleMap: Record<BatchOperation, string> = {
	[BatchOperation.SET_PAID]: 'Marcar pedidos como pagados',
	[BatchOperation.SET_INVOICED]: 'Marcar pedidos como facturados',
	[BatchOperation.SET_PICKED_UP]: 'Marcar pedidos como recogidos',
	[BatchOperation.NOTIFY_ORDERS]: 'Notificar pedidos (sólo finalizados)'
};

export const orderStatusMap: Record<OrderStatus, string> = {
	[OrderStatus.FINISHED]: 'Finalizado',
	[OrderStatus.PICKED_UP]: 'Recogido',
	[OrderStatus.PENDING]: 'Pendiente',
	[OrderStatus.QUOTE]: 'Presupuesto',
	[OrderStatus.DELETED]: 'Eliminado'
};

export enum OrderActionNames {
	CREATE_ORDER = 'createOrder',
	CREATE_QUOTE = 'createQuote',
	EDIT_ORDER = 'editOrder',
	CREATE_EXTERNAL_ORDER = 'createExternalOrder',
	CHANGE_STATUS = 'changeOrderStatus',
	PROMOTE = 'promoteOrder',
	DELETE = 'deleteOrder',
	DENOTE = 'denoteOrder',
	SAVE_LOCATION = 'saveLocation',
	CHANGE_PAYMENT = 'changePayment',
	SET_INVOICED = 'setInvoiced',
	SET_NOT_INVOICED = 'setNotInvoiced'
}

export const weekDayMap: Record<string, string> = {
	['Mon']: 'Lun',
	['Tue']: 'Mar',
	['Wed']: 'Mie',
	['Thu']: 'Jue',
	['Fri']: 'Vie',
	['Sat']: 'Sab',
	['Sun']: 'Dom'
};
