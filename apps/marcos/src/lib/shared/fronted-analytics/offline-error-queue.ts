import { browser } from '$app/environment';
import { trackError } from './posthog';

const QUEUE_KEY = 'posthog_error_queue';
const MAX_QUEUE_SIZE = 50;

interface QueuedError {
	message: string;
	stack?: string;
	timestamp: number;
}

function getQueue(): QueuedError[] {
	if (!browser) return [];
	try {
		return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
	} catch {
		return [];
	}
}

function saveQueue(queue: QueuedError[]) {
	if (!browser) return;
	localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
}

export function queueError(error: Error, source?: string) {
	if (!browser) return;
	const success = trackError(error, { source, originalStack: error.stack });
	if (success) {
		return;
	}

	const queue = getQueue();
	queue.push({
		message: error.message,
		stack: error.stack,
		timestamp: Date.now()
	});
	saveQueue(queue);
}

export function flushErrorQueue() {
	if (!browser) return;

	const queue = getQueue();
	if (queue.length === 0) return;

	const failedItems: QueuedError[] = [];

	queue.forEach((item) => {
		const error = new Error(item.message);
		if (item.stack) error.stack = item.stack;
		const success = trackError(error, {
			queuedAt: item.timestamp,
			wasOffline: true,
			originalStack: item.stack
		});
		if (!success) {
			failedItems.push(item);
		}
	});

	if (failedItems.length === 0) {
		localStorage.removeItem(QUEUE_KEY);
	} else {
		saveQueue(failedItems);
	}
}
