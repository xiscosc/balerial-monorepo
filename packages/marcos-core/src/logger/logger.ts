import pino, { Logger } from 'pino';
import pretty from 'pino-pretty';

export const getLogger = (name: string, forLambda: boolean = false): Logger => {
	if (forLambda) {
		return pino({ base: { name } });
	}
	return pino(
		{ base: { name } },
		pretty({
			colorize: true
		})
	);
};

export const getLoggerForLambda = (lambdaName: string): Logger => getLogger(lambdaName, true);
