import { ICoreConfigurationForAWSLambda } from '@marcsimolduressonsardina/core/config';
import { ServiceFactory } from '@marcsimolduressonsardina/core/service';
import { AppUser } from '@marcsimolduressonsardina/core/type';
import { DateTime } from 'luxon';

export async function lambdaGenerateReports(
	storeId?: string,
	oderAuditTrailTableName?: string,
	orderTableName?: string,
	customerTableName?: string,
	reportsBucketName?: string,
	calculatedItemTableName?: string
): Promise<void> {
	const user: AppUser = {
		id: 'automation@lambda.aws',
		storeId: storeId ?? '',
		name: 'AWS LAMBDA',
		priceManager: true
	};

	const configuration: ICoreConfigurationForAWSLambda = {
		runInAWSLambda: true,
		storeId: user.storeId,
		orderAuditTrailTable: oderAuditTrailTableName,
		orderTable: orderTableName,
		customerTable: customerTableName,
		reportsBucket: reportsBucketName,
		calculatedItemTable: calculatedItemTableName,
		listPricingTable: 'no-needed',
		user
	};

	const services = ServiceFactory.createForLambda(configuration);
	const reportService = services.reportService;

	const dailyReport = await reportService.generateAndStoreDailyReport({
		year: DateTime.now().get('year'),
		month: DateTime.now().get('month'),
		day: DateTime.now().get('day')
	});

	await reportService.upadateWeeklyReport(dailyReport);
	await reportService.upadateMonthlyReport(dailyReport);
}
