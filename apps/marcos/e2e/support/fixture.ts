import { readFileSync } from 'node:fs';

// The anonymized dataset `bun run e2e:seed` loads into the e2e tables (same one the marcos-core tests use).
// Read-only tests pick their rows from here instead of hardcoding ids.
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
	readFileSync(
		new URL('../../../../packages/marcos-core/test/fixtures/data.json', import.meta.url),
		'utf8'
	)
);

// Tests that write create their own rows; make them unique per run so reruns without a reseed still pass
export const runId = Date.now().toString(36);
export const uniquePhone = () => `6${Date.now().toString().slice(-8)}`;
