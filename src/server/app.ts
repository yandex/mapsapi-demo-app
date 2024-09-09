import * as turf from '@turf/turf';

import horseImg from '../common/images/horse.png';
import telescopeImg from '../common/images/telescope.png';
import { correctRouteData, findNearestIndex } from '../common/utils/route-data';
import {
	bbox as calculateBbox,
	getRandomPointInBbox,
	rnd,
	seed
} from '../common/utils/utils';
import { language } from '../langs';
import { regionConfig } from '../region';
import {
	Driver,
	DriverState,
	Order,
	OrderState,
	OrderType,
	Pickpoint,
	Point,
	Product,
	RawSuggestItem,
	RouteData,
	RouteMeta,
	RouteMode,
	RouterResponse,
	RouteType,
	SuggestItem,
	SuggestResult,
	Warehouse,
	Waypoint
} from '../types';

import initMigration from './migrations/init.sql';
import { buildDistanceMatrix } from './providers/distance-matrix';
import { geocode } from './providers/geocoder';
import { suggest } from './providers/geosuggest';
import { buildIsochrone } from './providers/isochrone';
import { buildRoute } from './providers/router';
import { db, sql } from './db';
import { Server } from './lib';

const currencyRateByLanguage = process.env.currencyRateByLanguage as unknown as
	| Partial<Record<string, number>>
	| undefined;
const currencyRate = currencyRateByLanguage?.[language] ?? 1;

const { bbox, zoom } = regionConfig;
const center: Point = [
	bbox[0][0] + (bbox[1][0] - bbox[0][0]) / 2,
	bbox[0][1] + (bbox[1][1] - bbox[0][1]) / 2
];

// Replace with your express/fastify.
const server = new Server();

await db.run(initMigration);

const PICKPOINT_DESCRIPTION = [
	'The pickpoint is located next to the ATM',
	'The pickpoint is located on the 1st floor of the shopping center',
	'The pickpoint is located in the post office'
];

Array.from({ length: 300 }).forEach(async () => {
	const position = getRandomPointInBbox(bbox);
	await db.run(
		`--sql
		INSERT INTO pickpoints (description, features, position, minX, maxX, minY, maxY)
		VALUES (:description, :features, :position, :x, :x, :y, :y);
	`,
		{
			':description':
				PICKPOINT_DESCRIPTION[
					Math.floor(Math.random() * PICKPOINT_DESCRIPTION.length)
				],
			':features': JSON.stringify({
				card: rnd() > 0.5,
				return: rnd() > 0.5
			}),
			':position': JSON.stringify(position),
			':x': position[0],
			':y': position[1]
		}
	);
});

const warehouses: Warehouse[] = Array.from({ length: 20 }).map((_, index) => ({
	id: index + 1,
	position: getRandomPointInBbox(bbox)
}));

server.use(async req => {
	const match = req.headers.authorization?.match(
		/^Bearer\s+(?<name>client|manager|driver):(?<id>\d+)$/
	);
	if (!match || !match.groups) {
		return { status: 403 };
	}

	req.auth[match.groups.name] = Number(match.groups.id);
});

server.get('/api/config', async () => {
	return { status: 200, body: { bbox, center, zoom } };
});

server.get('/api/driver/self', async req => {
	const driver = await findDriver(Number(req.auth.driver));

	return { status: 200, body: driver };
});

server.post('/api/driver/self', async req => {
	const [{ id }] = await sql<{ id: number }>(
		`--sql
			INSERT INTO drivers (name, state, avatar)
			VALUES (:name, :state, :avatar)
			RETURNING drivers.id
		`,
		{
			':name': req.body.name as string,
			':state': req.body.state as keyof typeof DriverState,
			':avatar': (req.body.avatar as string) ?? null
		}
	);

	const driver = await findDriver(id);

	return { status: 200, body: driver };
});

server.post('/api/driver/track', async req => {
	await sql(`UPDATE drivers SET position = :position WHERE id = :driverId`, {
		':driverId': req.auth.driver!,
		':position': JSON.stringify(req.body.position)
	});
	return { status: 200 };
});

server.post('/api/driver/route', async req => {
	const route = await buildRoute(
		req.body.waypoints as Point[],
		RouteMode.driving
	);

	return { status: 200, body: route };
});

server.get('/api/driver/orders/available', async req => {
	const orders = await sql<Order>(
		`--sql
			SELECT orders.*, routes.meta AS plannedRouteMeta
			FROM orders
			INNER JOIN routes ON routes.order_id = orders.id AND routes.type = :planned
			LEFT JOIN drivers_declined_orders
				ON drivers_declined_orders.driver_id = :driverId AND drivers_declined_orders.order_id = orders.id
			WHERE (orders.state = :new AND drivers_declined_orders.order_id IS NULL)
			ORDER BY id ASC
		`,
		{
			':new': OrderState.new,
			':planned': RouteType.planned,
			':driverId': req.auth.driver!
		}
	);
	orders.forEach(parseDbOrder);

	// Show manual orders first
	orders.sort(
		(a, b) =>
			Number(a.meta.autoplay ?? false) - Number(b.meta.autoplay ?? false)
	);

	return { status: 200, body: orders };
});

server.get('/api/driver/orders/history', async req => {
	const orders = await sql<Order>(
		`--sql
			SELECT orders.*, routes.meta AS plannedRouteMeta
			FROM orders
			INNER JOIN routes ON routes.order_id = orders.id AND routes.type = :planned
			WHERE orders.state IN (:completed, :delivered) AND orders.driver_id = :driverId
			ORDER BY id ASC
		`,
		{
			':completed': OrderState.completed,
			':delivered': OrderState.delivered,
			':planned': RouteType.planned,
			':driverId': req.auth.driver!
		}
	);

	orders.forEach(parseDbOrder);

	return { status: 200, body: orders };
});

server.get('/api/driver/orders/:id', async req => {
	const order = await findOrder(Number(req.params.id));

	return { status: 200, body: order };
});

server.post('/api/driver/orders/:id/decline', async req => {
	await sql(
		`--sql
			INSERT INTO drivers_declined_orders (driver_id, order_id)
			VALUES (:driverId, :orderId)
		`,
		{
			':driverId': req.auth.driver!,
			':orderId': req.params.id!
		}
	);

	return { status: 200, body: { ok: true } };
});

server.post('/api/driver/orders/:id/accept', async req => {
	// TODO: enforce that driver can have exactly one order

	const orderId = Number(req.params.id);
	const driverId = Number(req.auth.driver);

	const updates = await sql<{ id: number }>(
		`--sql
			UPDATE orders
			SET driver_id = :driverId, state = :newState
			WHERE state = :oldState AND id = :orderId
			RETURNING orders.id
		`,
		{
			':driverId': driverId,
			':orderId': orderId,
			':oldState': OrderState.new,
			':newState': OrderState.accepted
		}
	);

	if (updates.length === 0) return { status: 200, body: { ok: false } };

	const [order, driver, plannedRouteData] = await Promise.all([
		findOrder(orderId),
		findDriver(driverId),
		findRoute(RouteType.planned, orderId)
	]);
	if (!driver || !order || !plannedRouteData) return { status: 500 };

	const arrivalRouteWaypoints = [
		{
			coordinates: driver.position,
			description:
				(await geocode({ point: driver.position, language }))?.name ??
				driver.position.join(', ')
		},
		order.waypoints[0]
	];

	const arrivalRoute = await buildRoute(
		arrivalRouteWaypoints.map(w => w.coordinates),
		plannedRouteData.meta.mode
	);

	if (!arrivalRoute) return { status: 500 };

	await storeRoute(RouteType.arrival, order, arrivalRoute, {
		waypoints: arrivalRouteWaypoints,
		price: 0,
		updatedAt: new Date().toISOString()
	});

	const remainingRoute: RouterResponse = {
		points: arrivalRoute.points.concat(plannedRouteData.points),
		duration: arrivalRoute.duration + plannedRouteData.meta.duration,
		distance: arrivalRoute.distance + plannedRouteData.meta.distance,
		mode: plannedRouteData.meta.mode
	};

	await storeRoute(RouteType.remaining, order, remainingRoute, {
		waypoints: [arrivalRouteWaypoints[0], ...order.waypoints],
		price: plannedRouteData.meta.price,
		updatedAt: new Date().toISOString()
	});

	const actualRoute = {
		points: [],
		duration: 0,
		distance: 0,
		mode: plannedRouteData.meta.mode
	};
	await storeRoute(RouteType.actual, order, actualRoute, {
		waypoints: [arrivalRouteWaypoints[0], ...order.waypoints],
		price: plannedRouteData.meta.price,
		updatedAt: new Date().toISOString()
	});

	return { status: 200, body: { ok: true } };
});

server.post('/api/driver/orders/:id/start', async req => {
	const [order] = await sql<Order>(
		`--sql
			UPDATE orders
			SET state = :newState
			WHERE state = :oldState AND id = :orderId AND driver_id = :driverId
			RETURNING orders.id
		`,
		{
			':driverId': req.auth.driver!,
			':orderId': req.params.id!,
			':oldState': OrderState.accepted,
			':newState': OrderState.delivering
		}
	);
	if (!order) {
		return { status: 400 };
	}

	return { status: 200, body: { ok: true } };
});

server.post('/api/driver/orders/:id/delivered', async req => {
	const [order] = await sql<Order>(
		`--sql
			UPDATE orders
			SET state = :newState
			WHERE state = :oldState AND id = :orderId AND driver_id = :driverId
			RETURNING orders.id
		`,
		{
			':driverId': req.auth.driver!,
			':orderId': req.params.id!,
			':oldState': OrderState.delivering,
			':newState': OrderState.delivered
		}
	);
	if (!order) {
		return { status: 400 };
	}

	return { status: 200, body: { ok: true } };
});

server.post('/api/driver/orders/:id/reroute', async req => {
	const order = await findOrder(Number(req.params.id));
	if (
		!order ||
		order?.driver_id !== req.auth.driver ||
		(order.state !== OrderState.accepted &&
			order.state !== OrderState.delivering)
	) {
		return { status: 400 };
	}

	const route = await buildRoute(
		req.body.waypoints as Point[],
		RouteMode.driving
	);

	if (!route) return { status: 500 };

	await sql(
		`--sql
			UPDATE routes
			SET points = :points
			WHERE order_id = :orderId AND type = :type
		`,
		{
			':type': RouteType.actual,
			':orderId': order.id,
			':points': JSON.stringify(route.points)
		}
	);

	return { status: 200, body: { route } };
});

server.get('/api/driver/orders/:id/routes/:type', async req => {
	const order = await findOrder(Number(req.params.id));
	if (
		req.params.type === RouteType.actual ||
		req.params.type === RouteType.arrival ||
		req.params.type === RouteType.remaining
	) {
		if (order?.driver_id !== req.auth.driver) return { status: 403 };
	}

	if (req.params.type === RouteType.planned) {
		// Another driver may accept the order between requesting order and it's route.
		if (
			order?.state !== OrderState.new &&
			order?.driver_id !== req.auth.driver
		) {
			return { status: 200, body: null };
		}
	}

	const routeData = await findRoute(
		req.params.type as keyof typeof RouteType,
		Number(req.params.id)
	);

	return { status: 200, body: routeData };
});

server.post('/api/driver/orders/:id/track', async req => {
	await sql(`UPDATE drivers SET position = :position WHERE id = :driverId`, {
		':driverId': req.auth.driver!,
		':position': JSON.stringify(req.body.position)
	});
	const order = await findOrder(Number(req.params.id));

	if (
		order === null ||
		order.state === OrderState.completed ||
		order.driver_id !== req.auth.driver!
	) {
		return { status: 400 };
	}

	await sql(
		`--sql
			INSERT INTO tracks (ts, driver_id, order_id, position)
			VALUES (:ts, :driverId, :orderId, :position)
		`,
		{
			':ts': Date.now(),
			':driverId': req.auth.driver!,
			':orderId': order.id,
			':position': JSON.stringify(req.body.position)
		}
	);

	const actualRouteData = await findRoute('actual', order.id);
	const remainingRouteData = await findRoute('remaining', order.id);

	if (!actualRouteData || !remainingRouteData) return { status: 500 };

	const index = findNearestIndex(
		remainingRouteData.points,
		req.body.position as Point
	);

	if (index === null) return { status: 200 };

	const nextActualRoute = getRouterResponseByData(
		correctRouteData(actualRouteData, points =>
			points.concat(remainingRouteData.points.slice(0, index + 1), [
				req.body.position as Point
			])
		)
	);
	const nextRemainingRoute = getRouterResponseByData(
		correctRouteData(remainingRouteData, points =>
			index < points.length - 1
				? [req.body.position as Point].concat(points.slice(index + 1))
				: []
		)
	);

	await storeRoute(
		RouteType.actual,
		order,
		nextActualRoute,
		actualRouteData.meta
	);
	await storeRoute(
		RouteType.remaining,
		order,
		nextRemainingRoute,
		remainingRouteData.meta
	);

	return { status: 200 };
});

server.get('/api/manager/orders', async () => {
	const limit = 50;
	const orders = await sql<Order>(
		`--sql
			SELECT *
			FROM orders
			WHERE state != :draft
			ORDER BY id DESC
			LIMIT :limit
		`,
		{
			':draft': OrderState.draft,
			':limit': limit + 1
		}
	);
	orders.forEach(order => parseDbOrder(order));

	const hasMore = orders.length >= limit;
	orders.slice(0, limit);

	const drivers = await sql<Driver>(
		`--sql
			SELECT *
			FROM drivers
			WHERE id IN (SELECT x.value FROM json_each(:ids) AS x) -- sqlite can't bind arrays
		`,
		{
			':ids': JSON.stringify(orders.map(x => x.driver_id))
		}
	);
	drivers.forEach(driver => parseDbDriver(driver));

	const items = orders.map(order => ({
		order,
		driver: drivers.find(x => x.id === order.driver_id)
	}));

	return { status: 200, body: { orders, items, hasMore } };
});

server.get('/api/manager/orders/:id', async req => {
	const order = await findOrder(Number(req.params.id));
	if (!order) {
		return { status: 404 };
	}

	let driver: Driver | null = null;
	if (order.state !== OrderState.completed) {
		driver = await findDriver(order.driver_id);
	}

	return { status: 200, body: { order, driver } };
});

server.get('/api/manager/orders/:id/routes/:type', async req => {
	const routeData = await findRoute(
		req.params.type as keyof typeof RouteType,
		Number(req.params.id)
	);

	return { status: 200, body: routeData };
});

server.get('/api/manager/drivers', async () => {
	const limit = 50;
	const drivers = await sql<Driver>(
		`--sql
		SELECT *
		FROM drivers
		ORDER BY id ASC
		LIMIT :limit
	`,
		{
			':limit': limit + 1
		}
	);
	drivers.forEach(driver => parseDbDriver(driver));

	const hasMore = drivers.length >= limit;
	drivers.slice(0, limit);

	const orders = await sql<Order>(
		`--sql
			SELECT *
			FROM orders
			WHERE driver_id IN (SELECT x.value FROM json_each(:ids) AS x) -- sqlite can't bind arrays
		`,
		{
			':ids': JSON.stringify(drivers.map(x => x.id))
		}
	);
	orders.forEach(order => parseDbOrder(order));

	const items = drivers.map(driver => ({
		driver,
		order: orders.find(
			x => x.driver_id === driver.id && x.state !== OrderState.completed
		)
	}));

	return { status: 200, body: { drivers, items, hasMore } };
});

server.get('/api/manager/drivers/:id', async req => {
	const driver = await findDriver(Number(req.params.id));
	if (!driver) return { status: 400 };

	const orders = await sql<Order>(
		`SELECT id FROM orders WHERE driver_id = :id AND state != :completed`,
		{
			':id': driver.id,
			':completed': OrderState.completed
		}
	);

	if (orders.length === 0) {
		return { status: 200, body: { driver } };
	}

	const order = await findOrder(orders[0].id);
	return { status: 200, body: { driver, order } };
});

server.get('/api/user/pickpoints', async () => {
	const pickpoints = await sql<Pickpoint>(`SELECT * FROM pickpoints`);
	pickpoints.forEach(pickpoint => parseDbPickpoint(pickpoint));
	return { status: 200, body: pickpoints };
});

server.get('/api/user/search', async req => {
	const result = await geocode({
		point: req.query.point?.split(',').map(Number) as Point | undefined,
		uri: req.query.uri as string | undefined,
		text: req.query.text as string | undefined,
		language
	});

	return { status: 200, body: result };
});

server.get('/api/user/suggest', async req => {
	const suggestItems = await suggest({
		text: req.query.text as string,
		bbox: req.query.bbox
			?.split('~')
			.map(point => point.split(',').map(Number)) as [Point, Point],
		language
	});

	if (!suggestItems) return { status: 200, body: [] };

	const result: SuggestResult = suggestItems.map(item => ({
		type: 'suggest',
		item
	}));

	const firstSuggest = result[0]?.item as RawSuggestItem | null;

	if (req.query.pickpoints === 'true' && firstSuggest) {
		const nearestPickpoints =
			await getSuggestNearestPickpoints(firstSuggest);

		result.unshift(...nearestPickpoints);
	}

	return { status: 200, body: result };
});

function getUserOrderPosition(
	order: Order,
	driver: Driver | null,
	waypoints?: Waypoint[]
): Point | undefined {
	switch (order.state) {
		case OrderState.draft:
		case OrderState.new:
			return;
		case OrderState.accepted:
			if (order.type === OrderType.delivery) {
				return driver?.position;
			}

			return;
		case OrderState.delivering:
			return driver?.position;
		case OrderState.delivered:
		case OrderState.completed:
			return waypoints?.at(-1)?.coordinates;
	}
}

server.get('/api/user/orders/:id', async req => {
	const order = await findOrder(Number(req.params.id));
	if (!order) return { status: 400 };

	const driver = await findDriver(order.driver_id);

	const position = getUserOrderPosition(
		order,
		driver,
		order.plannedRouteMeta?.waypoints
	);

	return {
		status: 200,
		body: { ...order, position, driver }
	};
});

server.get('/api/user/orders/:id/routes/:type', async req => {
	const params = {
		id: Number(req.params.id),
		type: req.params.type as keyof typeof RouteType,
		withArrival: req.query.withArrival === 'true'
	};

	let routeData = await findRoute(params.type, params.id);

	if (
		!params.withArrival &&
		(
			[RouteType.actual, RouteType.remaining] as (typeof params.type)[]
		).includes(params.type) &&
		routeData
	) {
		if (routeData.points.length > 2) {
			const index = findNearestIndex(
				routeData.points,
				routeData.meta.waypoints[1].coordinates
			);

			routeData = correctRouteData(routeData, points =>
				index !== null
					? points.slice(index)
					: params.type === 'actual'
						? []
						: points
			);
		}

		routeData.meta.waypoints = routeData.meta.waypoints.slice(-2);
	}

	return { status: 200, body: routeData };
});

server.post('/api/user/orders/:id/reroute', async req => {
	const id = Number(req.params.id);
	const order = await findOrder(id);
	if (order?.state !== OrderState.draft) return { status: 400 };

	const waypoints = await Promise.all(
		(req.body.waypoints as Point[]).map(async point => ({
			coordinates: point,
			description:
				(await geocode({ point, language }))?.name ?? point.join(', ')
		}))
	);
	const drivingRoute = await buildRoute(
		waypoints.map(x => x.coordinates),
		'driving'
	);
	const walkingRoute = await buildRoute(
		waypoints.map(x => x.coordinates),
		'walking'
	);

	if (!drivingRoute && !walkingRoute) return { status: 500 };

	// Cleanup routes
	await sql(`DELETE FROM routes WHERE order_id = :id`, { ':id': id });

	const updatedAt = new Date().toISOString();

	const body: RouteMeta[] = await [
		{ mode: RouteType.driving, route: drivingRoute },
		{ mode: RouteType.walking, route: walkingRoute }
	]
		.filter(params => Boolean(params.route))
		.reduce(
			async (promise, { mode, route }) => [
				...(await promise),
				await storeRoute(mode, order, route!, {
					price: Math.ceil(route!.distance * 0.01),
					updatedAt,
					waypoints
				})
			],
			Promise.resolve([] as RouteMeta[])
		);

	return { status: 200, body };
});

const PRODUCTS: Product[] = [
	{
		title: 'Telescope',
		description: 'Lightweight telescope with a tripod',
		price: 175 * currencyRate,
		image: telescopeImg
	},
	{
		title: 'Hobbyhorse',
		description: 'Very beautiful',
		price: 20 * currencyRate,
		image: horseImg
	}
];
server.post('/api/user/orders', async req => {
	const products: Product[] =
		(req.body.products as Product[] | undefined) ?? PRODUCTS;

	const [{ id }] = await sql<Order>(
		`--sql
			INSERT INTO orders (state, description, meta, created_at)
			VALUES (:state, :description, :meta, :created_at)
			RETURNING orders.id
		`,
		{
			':state': OrderState.draft,
			':description': String(req.body.description),
			':meta': JSON.stringify({
				...(req.body.meta ?? {}),
				products: products,
				totalAmount: products.reduce(
					(acc, product) => acc + product.price,
					0
				)
			} as Order['meta']),
			':created_at': new Date().toISOString()
		}
	);

	const order = await findOrder(id);

	return { status: 200, body: order };
});

server.post('/api/user/orders/:id/finalize', async req => {
	let order = await findOrder(Number(req.params.id));
	if (order?.state !== OrderState.draft) return { status: 400 };

	let meta: Partial<Order['meta']>;
	let init:
		| { mode: 'existing'; selected: keyof typeof RouteType }
		| { mode: 'new'; waypoints: Waypoint[]; price: number };

	if (req.body.type === OrderType.delivery) {
		meta = {};
		init = {
			mode: 'existing',
			selected: req.body.selected as keyof typeof RouteType
		};
	} else if (req.body.type === OrderType.pickpoint) {
		const [pickpoint] = await sql<Pickpoint>(
			`SELECT * FROM pickpoints WHERE id = :id`,
			{
				':id': req.body.pickpoint as number
			}
		);

		if (!pickpoint) return { status: 400 };
		parseDbPickpoint(pickpoint);

		const warehouse = await getNearestWarehouse(pickpoint.position);
		meta = { warehouse: warehouse.id, pickpoint: pickpoint.id };
		init = {
			mode: 'new',
			price: 0,
			waypoints: [
				{
					coordinates: warehouse.position,
					description:
						(await geocode({ point: warehouse.position, language }))
							?.name ?? warehouse.position.join(', ')
				},
				{
					coordinates: pickpoint.position,
					description:
						(await geocode({ point: pickpoint.position, language }))
							?.name ?? pickpoint.position.join(', ')
				}
			]
		};
	} else if (req.body.type === OrderType.address) {
		const destination = req.body.destination as Point;
		const warehouse = await getNearestWarehouse(destination);
		meta = { warehouse: warehouse.id };
		init = {
			mode: 'new',
			price: 0,
			waypoints: [
				{
					coordinates: warehouse.position,
					description:
						(await geocode({ point: warehouse.position, language }))
							?.name ?? warehouse.position.join(', ')
				},
				{
					coordinates: destination,
					description:
						(await geocode({ point: destination, language }))
							?.name ?? destination.join(', ')
				}
			]
		};
	} else {
		return { status: 400 };
	}

	let waypoints: Waypoint[];
	if (init.mode === 'existing') {
		const routeData = await findRoute(init.selected, order.id);
		if (!routeData) return { status: 400 };

		waypoints = routeData.meta.waypoints;

		await cloneRoute(routeData.order_id, routeData.type, RouteType.planned);
	} else if (init.mode === 'new') {
		waypoints = init.waypoints;
		const response = await buildRoute(
			init.waypoints.map(x => x.coordinates),
			RouteMode.driving
		);
		if (!response) return { status: 500 };

		await storeRoute(RouteType.planned, order, response, {
			waypoints: init.waypoints,
			price: init.price,
			updatedAt: new Date().toISOString()
		});
	} else {
		throw new Error(`Bad mode ${init}`);
	}

	await sql<Order>(
		`--sql
			UPDATE orders
			SET type = :type, state = :newState, waypoints = :waypoints, meta = :meta
			WHERE id = :id AND state = :oldState
		`,
		{
			':id': order.id,
			':type': req.body.type,
			':oldState': OrderState.draft,
			':newState': OrderState.new,
			':waypoints': JSON.stringify(waypoints),
			':meta': JSON.stringify({
				...order.meta,
				...meta,
				surge: 1 + 0.6 * (seed(order.id)() - 0.5)
			})
		}
	);

	order = (await findOrder(order.id))!;

	return { status: 200, body: order };
});

server.post('/api/user/orders/:id/confirm', async req => {
	const affected = await sql<Order>(
		`--sql
			UPDATE orders
			SET state = :newState
			WHERE id = :id AND state = :oldState
			RETURNING orders.id
		`,
		{
			':id': req.params.id!,
			':oldState': OrderState.delivered,
			':newState': OrderState.completed
		}
	);

	if (affected.length !== 1) return { status: 400 };

	const order = await findOrder(Number(req.params.id));

	return { status: 200, body: order };
});

async function cloneRoute(
	orderId: number,
	src: keyof typeof RouteType,
	dst: keyof typeof RouteType
) {
	const updates = await sql(
		`--sql
			INSERT INTO routes (type, order_id, points, meta)
			SELECT :dst, order_id, points, meta
			FROM routes
			WHERE type = :src AND order_id = :orderId
			RETURNING routes.order_id
		`,
		{
			':src': src,
			':dst': dst,
			':orderId': orderId
		}
	);
	if (!updates)
		throw new Error(
			`Failed to clone route (${src}, ${orderId}) to (${dst}, ${orderId})`
		);
}

async function storeRoute(
	type: keyof typeof RouteType,
	order: Order,
	route: RouterResponse,
	meta: Pick<RouteMeta, 'updatedAt' | 'price' | 'waypoints'>
): Promise<RouteMeta> {
	const fullMeta: Omit<RouteMeta, 'type'> = {
		...meta,
		duration: route.duration,
		distance: route.distance,
		mode: route.mode
	};

	await sql(
		`--sql
			INSERT INTO routes (type, order_id, points, meta)
			VALUES (:type, :orderId, :points, :meta)
			ON CONFLICT DO UPDATE SET points = excluded.points, meta = excluded.meta
		`,
		{
			':type': type,
			':orderId': order.id,
			':meta': JSON.stringify(fullMeta),
			':points': JSON.stringify(route.points)
		}
	);

	return { ...fullMeta, type };
}

function parseDbOrder(order?: Order) {
	if (!order) return;
	order.plannedRouteMeta = JSON.parse(
		(order.plannedRouteMeta as unknown as string | undefined) ?? 'null'
	);
	order.actualRouteMeta = JSON.parse(
		(order.actualRouteMeta as unknown as string | undefined) ?? 'null'
	);
	order.waypoints = JSON.parse(
		(order.waypoints as unknown as string | undefined) ?? 'null'
	);
	order.meta = JSON.parse(
		(order.meta as unknown as string | undefined) ?? 'null'
	);
}
function parseDbDriver(driver?: Driver) {
	if (!driver) return;
	driver.position = JSON.parse(driver.position as unknown as string);
}
function parseDbPickpoint(pickpoint?: Pickpoint) {
	if (!pickpoint) return;
	pickpoint.position = JSON.parse(pickpoint.position as unknown as string);
	pickpoint.features = JSON.parse(pickpoint.features as unknown as string);
}
function parseDbRoute(route?: RouteData) {
	if (!route) return;
	route.meta = JSON.parse(route.meta as unknown as string);
	route.meta.type = route.type;
	route.points = JSON.parse(
		(route.points as unknown as string | undefined) ?? 'null'
	);
}

async function findOrder(id: number | undefined | null): Promise<Order | null> {
	if (id === null || id === undefined) return null;

	const [order] = await sql<Order>(
		`--sql
			SELECT orders.*, planned_routes.meta AS plannedRouteMeta, actual_routes.meta AS actualRouteMeta
			FROM orders
			LEFT JOIN routes AS planned_routes
				ON planned_routes.order_id = orders.id AND planned_routes.type = :planned
			LEFT JOIN routes AS actual_routes
				ON actual_routes.order_id = orders.id AND actual_routes.type = :actual
			WHERE id = :id
		`,
		{
			':id': id,
			':planned': RouteType.planned,
			':actual': RouteType.actual
		}
	);

	parseDbOrder(order);
	return order;
}

async function findDriver(
	id: number | null | undefined
): Promise<Driver | null> {
	if (id === null || id === undefined) return null;

	const [driver] = await sql<Driver>(`SELECT * FROM drivers WHERE id = :id`, {
		':id': id
	});

	parseDbDriver(driver);
	return driver;
}

async function findRoute(
	type: keyof typeof RouteType,
	orderId: number
): Promise<RouteData | null> {
	const [route] = await sql<RouteData>(
		`SELECT * FROM routes WHERE order_id = :orderId AND type = :type`,
		{
			':orderId': orderId,
			':type': type
		}
	);

	parseDbRoute(route);
	return route;
}

async function getNearestWarehouse(point: Point): Promise<Warehouse> {
	const distanceMatrix = await buildDistanceMatrix(
		warehouses.map(({ position }) => position),
		[point],
		'driving'
	);
	if (!distanceMatrix) {
		return warehouses[0];
	}

	const routesToWarehouses = distanceMatrix.rows.map(row => row.elements[0]);
	const nearestWareHouseIndex = routesToWarehouses.reduce(
		(prev, current, currentIndex, array) =>
			current.status === 'OK' &&
			current.distance.value < array[prev].distance.value
				? currentIndex
				: prev,
		0
	);

	return warehouses[nearestWareHouseIndex];
}

interface NearestPickpoint {
	pickpoint: Pickpoint;
	distance: number;
}

async function getNearestPickpoints(
	point: Point,
	duration: number,
	count: number
): Promise<NearestPickpoint[]> {
	const isochrone = await buildIsochrone(point, duration, 'walking');

	const result: NearestPickpoint[] = [];

	if (!isochrone) return result;

	const bounds = calculateBbox(
		isochrone.hull.geometry.coordinates.flatMap(polygon =>
			polygon.flatMap(point => point)
		)
	);

	const pickpointsInBounds = await sql<Pickpoint>(
		`
		SELECT * FROM pickpoints
		WHERE minX >= :minX AND maxX <= :maxX AND minY >= :minY AND maxY <= :maxY
	`,
		{
			':minX': bounds[0][0],
			':maxX': bounds[1][0],
			':minY': bounds[0][1],
			':maxY': bounds[1][1]
		}
	);

	pickpointsInBounds.forEach(pickpoint => parseDbPickpoint(pickpoint));

	const pickpointsWithinPolygonFeatures = turf
		.pointsWithinPolygon(
			turf.featureCollection(
				pickpointsInBounds.map(({ position }, index) =>
					turf.point(position, { index })
				)
			),
			turf.multiPolygon(isochrone.hull.geometry.coordinates)
		)
		.features.slice(0, count);

	if (!pickpointsWithinPolygonFeatures.length) return [];

	const distanceMatrix = await buildDistanceMatrix(
		pickpointsWithinPolygonFeatures.map(
			({ geometry }) => geometry.coordinates as Point
		),
		[point],
		'walking'
	);

	pickpointsWithinPolygonFeatures.forEach((pickpointFeature, i) => {
		const matrixCell = distanceMatrix?.rows[i]?.elements[0];

		result.push({
			pickpoint: pickpointsInBounds[pickpointFeature.properties.index],
			distance:
				matrixCell?.status === 'OK'
					? matrixCell.distance.value
					: turf.distance(
							point,
							pickpointFeature.geometry.coordinates,
							{ units: 'meters' }
						)
		});
	});

	return result.sort((a, b) => a.distance - b.distance);
}

const EXACT_TAGS = ['business', 'street', 'metro', 'house'];
async function getSuggestNearestPickpoints(
	suggest: RawSuggestItem,
	duration = 20 * 60, // 20 minutes
	count = 3
): Promise<SuggestItem[]> {
	if (!EXACT_TAGS.some(tag => suggest.tags?.includes(tag))) return [];

	const geocodeResult = await geocode({ uri: suggest.uri });

	if (!geocodeResult) return [];

	const nearestPickpoints = await getNearestPickpoints(
		geocodeResult.coordinates,
		duration,
		count
	);

	return nearestPickpoints.map(({ pickpoint, distance }) => ({
		type: 'pickpoint',
		item: pickpoint,
		distance
	}));
}

function getRouterResponseByData(data: RouteData): RouterResponse {
	return {
		points: data.points,
		distance: data.meta.distance,
		duration: data.meta.duration,
		mode: data.meta.mode
	};
}

export default server;
