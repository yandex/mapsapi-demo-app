import * as turf from '@turf/turf';

import { fetchJson } from '../common/lib/api';
import { NEAR_METERS } from '../common/utils/route-data';
import { region } from '../region';
import { Driver, Order, Point, RouteData } from '../types';

import { timeout } from './common';

const driverSpeedByRegion = process.env.driverSpeedByRegion as unknown as
	| Partial<Record<string, number>>
	| undefined;
/** Speed in kilometers/second */
const driverSpeed =
	(driverSpeedByRegion?.[region] as number) ??
	(process.env.defaultDriverSpeed as unknown as number) ??
	25;

export async function autoplayDriver(driver: Driver) {
	const headers = { authorization: `Bearer driver:${driver.id}` };

	const order: Order = await selectOrder(driver, headers);
	if (Math.random() < 0.1) {
		const declineRes = await fetchJson<{ ok: boolean }>(
			`/api/driver/orders/${order.id}/decline`,
			{ method: 'POST', headers }
		);
		if (!declineRes.ok) {
			/* don't care */
		}
		return;
	}

	const acceptRes = await fetchJson<{ ok: boolean }>(
		`/api/driver/orders/${order.id}/accept`,
		{ method: 'POST', headers }
	).catch(() => ({ ok: false }));

	// Someone has already taken this order.
	if (!acceptRes.ok) return;

	await timeout(Math.random() * 5_000);

	const arrivalRoute = await fetchJson<RouteData | null>(
		`/api/driver/orders/${order.id}/routes/arrival`,
		{ headers }
	);

	// Someone has already taken this order.
	if (!arrivalRoute) return;

	await driveSubRoute(arrivalRoute.points, order.id, headers);

	await fetchJson(`/api/driver/orders/${order.id}/start`, {
		method: 'POST',
		headers
	});

	const plannedRoute = await fetchJson<RouteData>(
		`/api/driver/orders/${order.id}/routes/planned`,
		{ headers }
	);

	await driveSubRoute(plannedRoute.points, order.id, headers);

	await fetchJson(`/api/driver/orders/${order.id}/delivered`, {
		method: 'POST',
		headers
	});
}

async function driveSubRoute(
	points: Point[],
	orderId: number,
	headers: NonNullable<Parameters<typeof fetchJson>[1]>['headers']
) {
	await timeout(Math.random() * 2_500);

	let i = 1;
	await driveTheRoute(points, 50, async position => {
		if (i++ % 10 === 0) {
			await fetchJson(`/api/driver/orders/${orderId}/track`, {
				method: 'post',
				headers,
				body: { position },
				withoutLatency: true
			});
		}

		const distance = turf.distance(position, points.at(-1)!, {
			units: 'meters'
		});

		if (distance < NEAR_METERS) {
			await fetchJson(`/api/driver/orders/${orderId}/track`, {
				method: 'post',
				headers,
				body: { position },
				withoutLatency: true
			});
		}
	});
}

async function selectOrder(_driver: Driver, headers: HeadersInit) {
	let orders: Order[];

	// eslint-disable-next-line no-constant-condition
	while (true) {
		await timeout(Math.random() * 5_000);

		orders = await fetchJson<Order[]>('/api/driver/orders/available', {
			headers
		});

		const peekAutoplayThreshold = new Date(
			Date.now() - 15 * 1000
		).toISOString();
		const peekManualThreshold = new Date(
			Date.now() - 60 * 1000
		).toISOString();
		orders = orders.filter(
			order =>
				order.created_at <
				(order.meta.autoplay
					? peekAutoplayThreshold
					: peekManualThreshold)
		);
		if (orders.length !== 0) {
			break;
		}
	}

	return orders[Math.floor(Math.random() * orders.length)];
}

const MIN_CHUNKS_METERS = 20;
export async function driveTheRoute(
	route: Point[],
	delay: number,
	cb: (point: Point) => Promise<void>
) {
	if (!route.length) return;

	if (route.length < 2) {
		await cb(route.at(-1) as Point);
		return;
	}

	const chunkMeters = Math.max(
		Math.round((driverSpeed * 1000) / ((60 * 1000) / delay)),
		MIN_CHUNKS_METERS
	);

	const collection = turf.lineChunk(turf.lineString(route), chunkMeters, {
		units: 'meters'
	});

	for (const feature of collection.features) {
		await cb(feature.geometry.coordinates.at(-1) as Point);
		await timeout(delay);
	}
}
