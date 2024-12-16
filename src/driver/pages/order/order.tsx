import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';
import * as turf from '@turf/turf';

import Drawer from 'antd/lib/drawer';

import { driveTheRoute } from '../../../autoplay/driver';
import {
	useSubRoutes,
	useSubRoutesBounds
} from '../../../common/hooks/useSubRoutes';
import { type LngLat, Margin } from '../../../common/lib';
import { fetchJson } from '../../../common/lib/api';
import { updateLocationWithMargin } from '../../../common/utils/app-utils';
import { NEAR_METERS } from '../../../common/utils/route-data';
import { MapContext } from '../../../common/views/map-layout/map-layout';
import OrderRoute from '../../../common/views/order-route';
import { Driver, Order, OrderState, Point } from '../../../types';
import { getHeaders } from '../../utils/headers';
import { DeliveringState, OrderCard } from '../../views/order-card';

const MARGIN: Margin = [80, 80, 400, 80];

export function OrderPage() {
	const mapContext = useContext(MapContext);

	const navigate = useNavigate();

	const params = useParams<{ driverId: string; orderId: string }>();
	const headers = getHeaders(params.driverId!);

	const { data: driverInfo } = useSuspenseQuery({
		queryKey: ['/driver/self', params.orderId],
		queryFn: async () => fetchJson<Driver>('/api/driver/self', { headers })
	});

	const [driverCoordinates, setDriverCoordinates] = useState<
		LngLat | undefined
	>(driverInfo.position);

	React.useEffect(() => {
		setDriverCoordinates(driverInfo.position);
	}, [params.orderId]);

	const { data: order } = useSuspenseQuery({
		queryKey: ['/driver/order', 'order', params.orderId],
		queryFn: async () => {
			const order = await fetchJson<Order>(
				`/api/driver/orders/${params.orderId}`,
				{
					headers
				}
			);

			if (
				order.state !== OrderState.new &&
				order.driver_id !== Number(params.driverId)
			) {
				navigate(`/drivers/${params.driverId}/orders`);
			}

			return order;
		},
		refetchInterval: 400
	});

	const [deliveringState, setDeliveringState] = useState<DeliveringState>(
		order.state
	);

	const subRoutes = useSubRoutes({
		plannedQueryUrl: `/api/driver/orders/${params.orderId}/routes/planned`,
		arrivalQueryUrl: `/api/driver/orders/${params.orderId}/routes/arrival`,
		actualQueryUrl: `/api/driver/orders/${params.orderId}/routes/actual`,
		remainingQueryUrl: `/api/driver/orders/${params.orderId}/routes/remaining`,
		orderState: order.state,
		fetchArgs: { headers },
		enabled: order.state !== OrderState.completed,
		actualRefetchInterval: 110,
		remainingRefetchInterval: 2_000
	});

	const bounds = useSubRoutesBounds(
		subRoutes,
		order.state,
		driverCoordinates as Point
	);
	React.useEffect(() => {
		if (
			bounds &&
			(
				[OrderState.new, OrderState.accepted] as (typeof order.state)[]
			).includes(order.state)
		) {
			updateLocationWithMargin(
				mapContext.setMapProps,
				{ bounds },
				MARGIN
			);
		}
	}, [mapContext.setMapProps, order.state, bounds]);

	const acceptOrder = useCallback(async () => {
		const { ok } = await fetchJson<{ ok: boolean }>(
			`/api/driver/orders/${order.id}/accept`,
			{
				method: 'POST',
				headers
			}
		);

		if (!ok) {
			navigate(`/drivers/${params.driverId}/orders`);
		}

		setDeliveringState('accepted');
	}, [deliveringState]);

	const declineOrder = useCallback(async () => {
		await fetchJson(`/api/driver/orders/${order.id}/decline`, {
			method: 'POST',
			headers
		});

		navigate(`/drivers/${params.driverId}/orders`);
	}, [deliveringState]);

	const arriveToOrder = useCallback(async () => {
		if (deliveringState !== 'accepted' || !subRoutes.arrivalRouteData)
			return;

		setDeliveringState('arrivingStarted');

		await driving(
			subRoutes.arrivalRouteData.points,
			order.id,
			headers,
			newCoordinates => {
				setDriverCoordinates(newCoordinates);
			},
			() => setDeliveringState('arrivingFinished')
		);
	}, [deliveringState, subRoutes]);

	const takeOrder = useCallback(async () => {
		if (deliveringState !== 'arrivingFinished') return;

		setDeliveringState('delivering');

		await fetchJson<{ ok: boolean }>(
			`/api/driver/orders/${order.id}/start`,
			{
				method: 'POST',
				headers
			}
		);
	}, [deliveringState]);

	const navigateOrder = useCallback(async () => {
		if (
			deliveringState === 'navigationStarted' ||
			deliveringState === 'navigationFinished' ||
			!subRoutes.plannedRouteData
		)
			return;

		setDeliveringState('navigationStarted');

		await driving(
			subRoutes.plannedRouteData.points,
			order.id,
			headers,
			newCoordinates => setDriverCoordinates(newCoordinates),
			() => setDeliveringState('navigationFinished')
		);
	}, [deliveringState, subRoutes]);

	const deliverOrder = useCallback(async () => {
		if (deliveringState !== 'delivered') {
			setDeliveringState('delivered');

			await fetchJson(`/api/driver/orders/${order.id}/delivered`, {
				method: 'POST',
				headers
			});
		}

		navigate(`/drivers/${params.driverId}/orders`);
	}, [deliveringState]);

	const progress = useMemo(() => {
		const route = subRoutes.remainingRouteData ??
			subRoutes.plannedRouteData ?? {
				points: [],
				meta: { duration: 0, distance: 0 }
			};

		return {
			time: route.meta.duration,
			distance: route.meta.distance
		};
	}, [driverCoordinates, subRoutes]);

	return (
		<>
			{subRoutes && (
				<OrderRoute
					driverCoordinates={driverCoordinates}
					orderType={order.type}
					orderState={order.state}
					meta={order.meta}
					subRoutes={subRoutes}
				/>
			)}
			<Drawer open placement="bottom" mask={false} getContainer={false}>
				<OrderCard
					order={order}
					progress={progress}
					onAcceptClick={acceptOrder}
					onDeclineClick={declineOrder}
					onTakeClick={takeOrder}
					onNavigateClick={navigateOrder}
					onDeliverClick={deliverOrder}
					onStartClick={arriveToOrder}
					deliveringState={deliveringState}
				/>
			</Drawer>
		</>
	);
}

async function driving(
	routePoints: Point[],
	orderId: number,
	headers: HeadersInit,
	updateCoordinates: (newCoordinates: LngLat) => void,
	onDelivered: () => void
): Promise<void> {
	updateCoordinates(routePoints[0] as LngLat);

	const geolocationMock = mockGeolocationApi();

	let positionWatchId!: number;
	const navigating = new Promise<void>(resolve => {
		let i = 1;
		positionWatchId = navigator.geolocation.watchPosition(
			async position => {
				const coordinates: Point = [
					position.coords.longitude,
					position.coords.latitude
				];

				if (i++ % 10 === 0) {
					await fetchJson(`/api/driver/orders/${orderId}/track`, {
						method: 'post',
						headers,
						body: { position: coordinates },
						withoutLatency: true
					});
				}

				updateCoordinates(coordinates);

				const distance = turf.distance(
					coordinates,
					routePoints.at(-1)!,
					{ units: 'meters' }
				);

				if (distance < NEAR_METERS) {
					await fetchJson(`/api/driver/orders/${orderId}/track`, {
						method: 'post',
						headers,
						body: { position: coordinates },
						withoutLatency: true
					});
					resolve();
				}
			}
		);
	});

	driveTheRoute(routePoints, 50, async position =>
		geolocationMock.updatePosition(position)
	);

	await navigating;

	navigator.geolocation.clearWatch(positionWatchId);
	geolocationMock.reset();

	onDelivered();
}

const mockGeolocationApi = () => {
	const watchPositionOriginal = navigator.geolocation.watchPosition;
	const clearWatchOriginal = navigator.geolocation.clearWatch;

	// start monkey patch ¯\_(ツ)_/¯
	let updatePosition: (coordinates: Point) => void;
	navigator.geolocation.watchPosition = cb => {
		updatePosition = coordinates => {
			setTimeout(() => {
				cb({
					coords: {
						longitude: coordinates[0],
						latitude: coordinates[1]
					}
				} as GeolocationPosition);
			});
		};
		return 0;
	};
	navigator.geolocation.clearWatch = () => {
		updatePosition = () => {};
	};

	return {
		get updatePosition() {
			return updatePosition;
		},
		reset() {
			navigator.geolocation.watchPosition = watchPositionOriginal;
			navigator.geolocation.clearWatch = clearWatchOriginal;
		}
	};
};
