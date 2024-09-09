import { GeosuggestType, Point, RawSuggestItem } from '../../types';

export async function suggest(args: {
	bbox?: [Point, Point];
	text: string;
	highlight?: boolean;
	language?: string;
	results?: number;
	types?: GeosuggestType[];
	strict?: boolean;
}): Promise<RawSuggestItem[] | null> {
	if (!args.text) return [];

	const geosuggestUrl = new URL(process.env.geosuggestApiUrl!);

	geosuggestUrl.searchParams.set('apikey', process.env.APIKEY!);
	geosuggestUrl.searchParams.set('text', args.text);
	geosuggestUrl.searchParams.set('lang', args.language ?? 'en_US');
	geosuggestUrl.searchParams.set('print_address', '1');
	geosuggestUrl.searchParams.set('attrs', 'uri');

	if (args.results) {
		geosuggestUrl.searchParams.set('results', String(args.results));
	}

	if (args.highlight === false) {
		geosuggestUrl.searchParams.set('highlight', '0');
	}

	if (args.bbox) {
		geosuggestUrl.searchParams.set(
			'bbox',
			args.bbox.map(x => x.join(',')).join('~')
		);
	}

	if (args.strict) {
		geosuggestUrl.searchParams.set('strict_bounds', '1');
	}

	if (args.types) {
		geosuggestUrl.searchParams.set('types', args.types.join(','));
	}

	extendApiRequest(geosuggestUrl, 'suggest-api');

	const geosuggestRes = await fetch(geosuggestUrl).catch(() => null);
	if (!geosuggestRes || geosuggestRes.status !== 200) return null;

	const json = await geosuggestRes.json();

	return json.results;
}
