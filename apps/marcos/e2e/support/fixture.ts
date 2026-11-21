import { readFileSync } from 'node:fs';

type Row = Record<string, unknown>;

export type Fixture = {
	ORDER_TABLE: (Row & {
		uuid: string;
		shortId: string;
		publicId: string;
		status: string;
		customerUuid: string;
	})[];
	CUSTOMER_TABLE: (Row & { uuid: string; name: string; phone: string })[];
	CALCULATED_ITEM_ORDER_TABLE: (Row & { orderUuid: string })[];
	LIST_PRICING_TABLE: (Row & { id: string; type: string })[];
	CONFIG_TABLE: (Row & { id: string; value: unknown })[];
	FILE_TABLE?: Row[];
};

export const fixture: Fixture = JSON.parse(
	readFileSync(new URL('../../../marcos-aws/local/fixtures/data.json', import.meta.url), 'utf8')
);

export const runId = Date.now().toString(36);
export const uniquePhone = () => `6${Date.now().toString().slice(-8)}`;
