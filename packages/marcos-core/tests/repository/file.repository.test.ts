import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { FileDto } from '../../src/repository/dto/file.dto';
import { FileRepositoryDynamoDb } from '../../src/repository/dynamodb/file.repository.dynamodb';
import { config, createTable, deleteTable, tableName } from './dynamodb-test.utils';

const table = tableName('files');
const repository = new FileRepositoryDynamoDb({ ...config, fileTable: table });
const file = (fileUuid: string, overrides: Partial<FileDto> = {}): FileDto =>
	({ orderUuid: 'order-1', fileUuid, key: `${fileUuid}.jpg`, type: 'document', ...overrides }) as FileDto;

beforeAll(() => createTable(table, 'orderUuid', 'fileUuid'));
afterAll(() => deleteTable(table));

describe('FileRepositoryDynamoDb', () => {
	test('persists, lists and deletes files with compound keys', async () => {
		const first = file('file-1');
		const second = file('file-2');
		await repository.createFile(first);
		await repository.createFile(second);
		expect(await repository.getFile('order-1', 'file-1')).toEqual(first);
		expect(await repository.getFilesByOrder('order-1')).toEqual(expect.arrayContaining([first, second]));

		await repository.deleteFile('order-1', 'file-1');
		await repository.deleteFiles([second]);
		expect(await repository.getFilesByOrder('order-1')).toEqual([]);
	});

	test('returns only original keys for optimized photos', async () => {
		await repository.createFile(file('photo', { type: 'photo', optimizedKey: 'optimized', thumbnailKey: 'thumb' }));
		await repository.createFile(file('document'));
		expect(await repository.getOptimizedPhotoFileOriginalKeys()).toEqual([{ key: 'photo.jpg' }]);
	});
});
