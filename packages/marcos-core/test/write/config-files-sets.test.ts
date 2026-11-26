import { describe, expect, test } from 'bun:test';
import {
	FileType,
	ImageVariant,
	OrderAuditTrailType
} from '@marcsimolduressonsardina/contracts/type';
import {
	customersById,
	fixture,
	groupBy,
	locations,
	reserve,
	reserveSameCustomer,
	services
} from '../support';

const { configService, fileService, orderSetService, orderAuditTrailService } = services();

describe('locations config (config/orders/locations)', () => {
	test('the edited list is saved', async () => {
		const edited = [...locations.slice(1), locations[0]!];
		await configService.storeLocationsList(edited);
		expect(await configService.getLocationsList()).toEqual(edited);
	});
});

describe('order files (api/orders/[id]/files)', () => {
	const files = fixture.FILE_TABLE ?? [];

	test('new files get the storage key of their type and are listed with the order', async () => {
		const [order] = reserve(1, (o) => !files.some((f) => f.orderUuid === o.uuid));
		const photo = files.find((f) => f.type === 'photo' && !f.optimizedKey)!;
		const optimized = files.find((f) => f.type === 'photo' && f.optimizedKey)!;
		const video = files.find((f) => f.type === 'video')!;
		const other = files.find((f) => f.type === 'other')!;

		const created = [
			await fileService.createFile(order!.uuid, photo.originalFilename, ImageVariant.ORIGINAL),
			await fileService.createFile(order!.uuid, optimized.originalFilename, ImageVariant.OPTIMIZED),
			await fileService.createFile(order!.uuid, video.originalFilename),
			await fileService.createFile(order!.uuid, other.originalFilename),
			await fileService.createNoArtFile(order!.uuid)
		];
		const keyOf = (url: string) =>
			decodeURIComponent(new URL(url).pathname).split('/').slice(2).join('/');
		const shape = (key: string, id: string) =>
			key.replace(order!.uuid, '<order>').replace(id, '<file>');
		const fixtureShape = (f: (typeof files)[number]) =>
			f.key.replace(f.orderUuid, '<order>').replace(f.fileUuid, '<file>');

		expect(created.map((f) => f.type)).toEqual([
			FileType.PHOTO,
			FileType.PHOTO,
			FileType.VIDEO,
			FileType.OTHER,
			FileType.NO_ART
		]);
		expect(created.slice(0, 4).map((f) => shape(keyOf(f.uploadUrl!), f.id))).toEqual(
			[photo, optimized, video, other].map(fixtureShape)
		);

		const listed = await fileService.getFilesByOrder(order!.uuid);
		expect(listed.map((f) => f.id).sort()).toEqual(created.map((f) => f.id).sort());
		expect(await fileService.getFile(order!.uuid, created[1]!.id)).toMatchObject({
			originalFilename: optimized.originalFilename
		});
	});

	test('deleting a file removes it and is recorded', async () => {
		const [orderUuid, orderFiles] = [...groupBy(files, (f) => f.orderUuid)].find(
			([, f]) => f.length > 1
		)!;
		const target = orderFiles[0]!;

		await fileService.deleteFile(orderUuid, target.fileUuid);

		expect(await fileService.getFile(orderUuid, target.fileUuid)).toBeUndefined();
		expect((await fileService.getFilesByOrder(orderUuid)).map((f) => f.id).sort()).toEqual(
			orderFiles
				.slice(1)
				.map((f) => f.fileUuid)
				.sort()
		);
		expect(
			(
				await orderAuditTrailService.getEntriesForOrder(orderUuid, OrderAuditTrailType.ATTACHMENT)
			).map((e) => [e.oldValue, e.newValue])
		).toEqual([[`${target.originalFilename} || ${target.fileUuid}`, '']]);
	});
});

describe('order sets (api/order-sets, order-sets/[id])', () => {
	test('orders of one customer form a set that is reused for the same orders', async () => {
		const picked = reserveSameCustomer(3);
		const ids = picked.map((o) => o.uuid);

		const set = await orderSetService.createOrderSet(ids);
		expect(Object.keys(set.orders).sort()).toEqual([...ids].sort());
		expect(set.createdBy).toMatchObject({ id: 'empleado1@local.test' });

		expect((await orderSetService.createOrderSet([...ids].reverse())).id).toBe(set.id);

		const loaded = (await orderSetService.getOrderSetById(set.id))!;
		expect(Object.keys(loaded.orders).sort()).toEqual([...ids].sort());
	});

	test('orders of different customers cannot form a set', async () => {
		const [first] = reserve(1, (o) => customersById.has(o.customerUuid));
		const [second] = reserve(
			1,
			(o) => customersById.has(o.customerUuid) && o.customerUuid !== first!.customerUuid
		);
		expect(orderSetService.createOrderSet([first!.uuid, second!.uuid])).rejects.toThrow(
			'same customer'
		);
	});
});
