import { GeocodeResult, Point } from '../../types';

export async function geocode(args: {
	bbox?: [Point, Point];
	uri?: string;
	text?: string;
	point?: Point;
	language?: string;
}): Promise<GeocodeResult | null> {
	const geocodeUrl = new URL(process.env.geocodeApiUrl!);

	geocodeUrl.searchParams.set('apikey', process.env.APIKEY!);
	geocodeUrl.searchParams.set('format', 'json');
	geocodeUrl.searchParams.set('results', '1');
	geocodeUrl.searchParams.set('lang', args.language ?? 'en_US');

	if (args.uri !== undefined) {
		geocodeUrl.searchParams.set('uri', args.uri);
	} else if (args.text !== undefined) {
		geocodeUrl.searchParams.set('geocode', args.text);
	} else if (args.point !== undefined) {
		geocodeUrl.searchParams.set('geocode', args.point.join(','));
	} else {
		return null;
	}

	if (args.bbox) {
		geocodeUrl.searchParams.set('rspn', '1');
		geocodeUrl.searchParams.set(
			'bbox',
			args.bbox.map(x => x.join(',')).join('~')
		);
	}

	extendApiRequest(geocodeUrl, 'geocoder-api');

	const geocodeRes = await fetch(geocodeUrl).catch(() => null);
	if (!geocodeRes || geocodeRes.status !== 200) return null;

	const json = await geocodeRes.json();
	const geoObject =
		json.response.GeoObjectCollection.featureMember[0]?.GeoObject;
	if (!geoObject) return null;

	return {
		name: geoObject.name,
		coordinates: geoObject.Point.pos.split(/\s+/).map(Number)
	};
}
