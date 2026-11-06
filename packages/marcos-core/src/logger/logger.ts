import pino, { type Logger } from 'pino';
import pretty from 'pino-pretty';

export const getLogger = (name: string): Logger => {
	return pino(
		{ base: { name } },
		pretty({
			colorize: true
		})
	);
};
