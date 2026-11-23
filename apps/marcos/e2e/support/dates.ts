export const isoDateInDays = (days: number) =>
	new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const displayDate = (isoDate: string) => isoDate.split('-').reverse().join('/');
