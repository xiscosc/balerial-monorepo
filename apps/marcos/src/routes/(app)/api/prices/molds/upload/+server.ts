import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { AuthService } from '@/server/service/auth.service';
import { MoldPriceLoader } from '@marcsimolduressonsardina/core/data';
import { ServerTracking } from '@/server/shared/tracking';

export const GET: RequestHandler = async ({ locals }) => {
	if (!AuthService.isAdmin(locals.user)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	const moldPriceLoader = new MoldPriceLoader(locals.config!);
	const { filename, url } = await moldPriceLoader.generateFileUploadUrl();

	await ServerTracking.event('mold_price_upload_requested', {
		user: locals.user!,
		context: locals.trackingContext
	});

	return json({ filename, url });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { filename } = (await request.json()) as { filename: string };
	if (filename == null) {
		return json({ error: 'Filename is required' }, { status: 400 });
	}

	try {
		const moldPriceLoader = new MoldPriceLoader(locals.config!);
		await moldPriceLoader.loadMoldPrices(filename);
	} catch (error: unknown) {
		console.error(error);
		return json({ error: 'Error loading the prices' }, { status: 500 });
	}

	await ServerTracking.event('mold_price_upload_completed', {
		user: locals.user!,
		context: locals.trackingContext
	});

	return json({ success: true });
};
