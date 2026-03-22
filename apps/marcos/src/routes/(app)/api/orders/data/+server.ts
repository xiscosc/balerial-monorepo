import type { RequestHandler } from './$types';
import { AuthService } from '@/server/service/auth.service';
import type { ReportDate } from '@marcsimolduressonsardina/core/type';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!AuthService.isAdmin(locals.user)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const { reportService } = locals.services!;
	const { startDate, endDate } = (await request.json()) as {
		startDate: ReportDate;
		endDate: ReportDate;
	};
	const report = await reportService.getDashboardReport(startDate, endDate);
	return json(report);
};
