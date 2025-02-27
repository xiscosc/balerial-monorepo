import { z } from 'zod';

const phoneRegex = z
	.string()
	.regex(/^\+\d{1,3}\d{9,15}$/, { message: 'El formato del teléfono no es correcto' })
	.default('+34');

export const customerSchema = z.object({
	name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }).default(''),
	phone: phoneRegex
});

export type CustomerSchema = typeof customerSchema;

export const linkCustomerSchema = z.object({
	name: z.string().default('').optional(),
	phone: phoneRegex
});

export type LinkCustomerSchema = typeof linkCustomerSchema;
export type GlobalCustomerSchema = CustomerSchema | LinkCustomerSchema;
