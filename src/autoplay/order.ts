import { fetchJson } from '../common/lib/api';
import { getRandomPointInBbox } from '../common/utils/utils';
import {
	Order,
	OrderState,
	OrderType,
	Pickpoint,
	Point,
	RouteMeta
} from '../types';

import { timeout } from './common';

export async function autoplayOrder() {
	const config = await fetchJson<{ bbox: [Point, Point] }>('/api/config');

	let order;
	order = await fetchJson<Order>('/api/user/orders', {
		method: 'post',
		body: { description: 'my order', meta: { autoplay: true } }
	});

	const types = [OrderType.address, OrderType.delivery, OrderType.pickpoint];
	const type = types[Math.floor(Math.random() * types.length)];

	if (type === OrderType.delivery) {
		const origin = getRandomPointInBbox(config.bbox);
		const destination = getRandomPointInBbox(config.bbox);

		const routes = await fetchJson<RouteMeta[]>(
			`/api/user/orders/${order.id}/reroute`,
			{
				method: 'post',
				body: { waypoints: [origin, destination] }
			}
		);

		order = await fetchJson<Order>(
			`/api/user/orders/${order.id}/finalize`,
			{
				method: 'post',
				body: {
					type,
					selected:
						routes[Math.floor(Math.random() * routes.length)].type
				}
			}
		);
	} else if (type === OrderType.pickpoint) {
		const pickpoints = await fetchJson<Pickpoint[]>('/api/user/pickpoints');
		const pickpoint =
			pickpoints[Math.floor(Math.random() * pickpoints.length)];

		order = await fetchJson<Order>(
			`/api/user/orders/${order.id}/finalize`,
			{
				method: 'post',
				body: { type, pickpoint: pickpoint.id }
			}
		);
	} else if (type === OrderType.address) {
		const destination = getRandomPointInBbox(config.bbox);

		order = await fetchJson<Order>(
			`/api/user/orders/${order.id}/finalize`,
			{
				method: 'post',
				body: { type, destination }
			}
		);
	}

	while (order.state !== OrderState.delivered) {
		await timeout(2_000);
		order = await fetchJson<Order>(`/api/user/orders/${order.id}`);
	}

	await fetchJson<Order>(`/api/user/orders/${order.id}/confirm`, {
		method: 'POST'
	});
}
