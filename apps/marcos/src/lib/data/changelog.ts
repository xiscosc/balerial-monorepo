import { ChangelogItemType, type Changelog } from '@/type/changelog.type';

export const Changelogs: Changelog[] = [
	{
		version: 20250615,
		title: 'Junio 2025',
		items: [
			{ text: 'Mejoras de seguridad', type: ChangelogItemType.SECURITY },
			{ text: 'Mejoras de rendimiento al crear pedidos', type: ChangelogItemType.TECHNICAL },
			{ text: 'Actualización del sistema', type: ChangelogItemType.SECURITY }
		]
	},
	{
		version: 20250710,
		title: 'Julio 2025',
		items: [
			{ text: 'Mejoras de seguridad', type: ChangelogItemType.SECURITY },
			{ text: 'Actualización del sistema', type: ChangelogItemType.SECURITY },
			{ text: 'Nueva fórmula: m2 * precio * iva * 12 + 2', type: ChangelogItemType.NEW },
			{
				text: 'Cambio de usuario al crear un pedido desde un presupuesto',
				type: ChangelogItemType.TECHNICAL
			},
			{ text: 'Cambios en la hoja de impresión', type: ChangelogItemType.MINOR_CHANGE }
		]
	},
	{
		version: 20250804,
		title: 'Agosto 2025',
		items: [
			{ text: 'Mejoras de seguridad', type: ChangelogItemType.SECURITY },
			{ text: 'Actualización del sistema', type: ChangelogItemType.SECURITY },
			{ text: 'Mejoras en la usabilidad y visibilidad', type: ChangelogItemType.TECHNICAL },
			{
				text: 'Forzado idioma español para evitar problemas de traducción',
				type: ChangelogItemType.TECHNICAL
			}
		]
	},
	{
		version: 20250930,
		title: 'Septiembre 2025',
		items: [
			{ text: 'Actualización del sistema', type: ChangelogItemType.SECURITY },
			{
				text: 'Solucionado problema al notificar pedidos finalizados por WhatsApp desde iPhone',
				type: ChangelogItemType.TECHNICAL
			},
			{
				text: 'Cambio en el campo PP por Medidas PP o Fondo (cm)',
				type: ChangelogItemType.MINOR_CHANGE
			},
			{ text: 'Nuevo estado de facturación en pedidos', type: ChangelogItemType.NEW },
			{ text: 'Nuevo botón de imprimir en listados', type: ChangelogItemType.NEW },
			{
				text: 'Actualización de seguridad en el procesamiento de excel',
				type: ChangelogItemType.SECURITY
			}
		]
	}
];
