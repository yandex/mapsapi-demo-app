import { IsochroneResponse, Point, RouteMode } from '../../types';

export async function buildIsochrone(
	point: Point,
	duration: number,
	mode: keyof typeof RouteMode
): Promise<IsochroneResponse | null> {
	const isochroneUrl = new URL(
		process.env.isochroneApiUrl!.replace('{{mode}}', mode)
	);
	isochroneUrl.searchParams.set('apikey', process.env.APIKEY!);
	isochroneUrl.searchParams.set('ll', point.join(','));
	isochroneUrl.searchParams.set('duration', String(duration));
	extendApiRequest(isochroneUrl, 'isochrone-api');

	const isochroneRes = await fetch(isochroneUrl).catch(() => null);
	if (!isochroneRes || isochroneRes.status !== 200) {
		return null;
	}

	return isochroneRes.json();
}
