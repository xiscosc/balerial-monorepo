import type {
	ICoreConfiguration,
	ICoreConfigurationForAWSLambda,
	ICorePublicConfiguration,
	ICorePublicConfigurationForAWSLambda
} from '../configuration/core-configuration.interface';
import { CalculatedItemService } from './calculated-item.service';
import { ConfigService } from './config.service';
import { CustomerService } from './customer.service';
import { FileService } from './file.service';
import { OrderAuditTrailService } from './order-audit-trail.service';
import { OrderService } from './order.service';
import { OrderSetService } from './order-set.service';
import { PricingService } from './pricing.service';
import { PublicReceiptService } from './public-receipt.service';
import { ReportService } from './report.service';

type AnyConfig = ICoreConfiguration | ICoreConfigurationForAWSLambda;

export class ServiceFactory {
	private _customerService?: CustomerService;
	private _orderAuditTrailService?: OrderAuditTrailService;
	private _pricingService?: PricingService;
	private _calculatedItemService?: CalculatedItemService;
	private _orderService?: OrderService;
	private _fileService?: FileService;
	private _configService?: ConfigService;
	private _orderSetService?: OrderSetService;
	private _reportService?: ReportService;

	private constructor(private readonly config: AnyConfig) {}

	static create(config: ICoreConfiguration): ServiceFactory {
		return new ServiceFactory(config);
	}

	static createForLambda(config: ICoreConfigurationForAWSLambda): ServiceFactory {
		return new ServiceFactory(config);
	}

	static createPublic(
		config: ICorePublicConfiguration | ICorePublicConfigurationForAWSLambda
	): PublicServiceFactory {
		return new PublicServiceFactory(config);
	}

	get customerService(): CustomerService {
		if (!this._customerService) {
			this._customerService = new CustomerService(this.config);
		}
		return this._customerService;
	}

	get orderAuditTrailService(): OrderAuditTrailService {
		if (!this._orderAuditTrailService) {
			this._orderAuditTrailService = new OrderAuditTrailService(this.config);
		}
		return this._orderAuditTrailService;
	}

	get pricingService(): PricingService {
		if (!this._pricingService) {
			this._pricingService = new PricingService(this.config);
		}
		return this._pricingService;
	}

	get calculatedItemService(): CalculatedItemService {
		if (!this._calculatedItemService) {
			this._calculatedItemService = new CalculatedItemService(this.config, this.pricingService);
		}
		return this._calculatedItemService;
	}

	get orderService(): OrderService {
		if (!this._orderService) {
			this._orderService = new OrderService(
				this.config,
				this.customerService,
				this.orderAuditTrailService,
				this.calculatedItemService,
				this.pricingService
			);
		}
		return this._orderService;
	}

	get fileService(): FileService {
		if (!this._fileService) {
			this._fileService = new FileService(this.config, this.orderAuditTrailService);
		}
		return this._fileService;
	}

	get configService(): ConfigService {
		if (!this._configService) {
			this._configService = new ConfigService(this.config);
		}
		return this._configService;
	}

	get orderSetService(): OrderSetService {
		if (!this._orderSetService) {
			this._orderSetService = new OrderSetService(this.config, this.orderService);
		}
		return this._orderSetService;
	}

	get reportService(): ReportService {
		if (!this._reportService) {
			this._reportService = new ReportService(
				this.config,
				this.orderAuditTrailService,
				this.customerService,
				this.orderService
			);
		}
		return this._reportService;
	}

	createPricingServiceWithMarkup = (markup: number): PricingService => {
		return new PricingService(this.config, markup);
	};

	createCalculatedItemServiceWithMarkup = (markup: number): CalculatedItemService => {
		return new CalculatedItemService(this.config, this.createPricingServiceWithMarkup(markup));
	};

	createOrderServiceWithMarkup = (markup: number): OrderService => {
		const pricingService = this.createPricingServiceWithMarkup(markup);
		const calculatedItemService = new CalculatedItemService(this.config, pricingService);
		return new OrderService(
			this.config,
			this.customerService,
			this.orderAuditTrailService,
			calculatedItemService,
			pricingService
		);
	};
}

export class PublicServiceFactory {
	private _publicReceiptService?: PublicReceiptService;
	private _pricingService?: PricingService;
	private _calculatedItemService?: CalculatedItemService;

	constructor(
		private readonly config: ICorePublicConfiguration | ICorePublicConfigurationForAWSLambda
	) {}

	get pricingService(): PricingService {
		if (!this._pricingService) {
			this._pricingService = new PricingService(this.config);
		}
		return this._pricingService;
	}

	get calculatedItemService(): CalculatedItemService {
		if (!this._calculatedItemService) {
			this._calculatedItemService = new CalculatedItemService(this.config, this.pricingService);
		}
		return this._calculatedItemService;
	}

	get publicReceiptService(): PublicReceiptService {
		if (!this._publicReceiptService) {
			this._publicReceiptService = new PublicReceiptService(
				this.config,
				this.calculatedItemService
			);
		}
		return this._publicReceiptService;
	}
}
