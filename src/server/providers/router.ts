import {
	Point,
	RawRouterResponse,
	RouteMode,
	RouterResponse
} from '../../types';

export async function buildRoute(
	waypoints: Point[],
	mode: keyof typeof RouteMode
): Promise<RouterResponse | null> {
	const routingUrl = new URL(process.env.routeApiUrl!);

	routingUrl.searchParams.set('apikey', process.env.APIKEY!);
	routingUrl.searchParams.set('mode', mode);
	routingUrl.searchParams.set(
		'waypoints',
		waypoints.map(x => x.slice().reverse().join(',')).join('|')
	);
	extendApiRequest(routingUrl, 'router-api');

	const routingRes = await fetch(routingUrl).catch(() => null);
	if (!routingRes || routingRes.status !== 200) {
		return null;
	}

	const json: RawRouterResponse = await routingRes.json();
	const legs = json.route.legs;

	const legsPoints = legs.map(leg =>
		leg.steps
			.flatMap(step => step.polyline.points)
			.map(point => point.reverse() as Point)
	);

	let points: Point[] = [];
	waypoints.forEach((waypoint, i) => {
		points.push(waypoint);

		if (i < legsPoints.length) {
			points = points.concat(legsPoints[i]);
		}
	});

	if (points.length <= waypoints.length) {
		return null;
	}

	let duration = legs
		.flatMap(leg => leg.steps)
		.reduce((total, x) => total + x.duration, 0);
	duration = Math.ceil(duration);
	let distance = legs
		.flatMap(leg => leg.steps)
		.reduce((total, x) => total + x.length, 0);
	distance = Math.ceil(distance);

	return { points, duration, distance, mode };
}
