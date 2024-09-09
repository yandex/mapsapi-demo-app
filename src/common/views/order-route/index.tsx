import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { OrderState, OrderType, Point, Waypoint } from '../../../types';
import { SubRoutesState } from '../../hooks/useSubRoutes';
import { LngLat, MapMarker } from '../../lib';
import { findNearestIndex } from '../../utils/route-data';
import OrderPoint from '../order-point';
import RouteMapFeature from '../route-map-feature';

import s from './index.module.css';

export function DriverPoint({ point }: { point: LngLat }) {
	return (
		<MapMarker coordinates={point} disableRoundCoordinates>
			<div className={s['driver-point']}></div>
		</MapMarker>
	);
}

interface Props {
	driverCoordinates?: LngLat;
	orderType?: keyof typeof OrderType;
	orderState?: keyof typeof OrderState;
	meta?: {
		warehouse?: number;
		pickpoint?: number;
	};
	subRoutes?: SubRoutesState;
	waypoints?: Waypoint[];
	withoutDriverPoint?: boolean;
	hidePastArrivalRoute?: boolean;
}

const OrderRoute: React.FC<Props> = ({
	subRoutes,
	driverCoordinates,
	orderType,
	orderState,
	meta,
	waypoints,
	withoutDriverPoint,
	hidePastArrivalRoute
}) => {
	const { t } = useTranslation();

	const computedWaypoints =
		waypoints ??
		subRoutes?.plannedRouteData?.meta.waypoints.slice(-2) ??
		[];
	const firstPoint = computedWaypoints[0]
		? {
				point: computedWaypoints[0].coordinates,
				title: (
					<div className={s.waypoint}>
						{orderType !== OrderType.delivery && meta?.warehouse
							? t('Warehouse #{{id}}', { id: meta.warehouse })
							: t(computedWaypoints[0].description)}
					</div>
				),
				color: 'var(--color-route-origin)'
			}
		: null;

	const lastPoint = computedWaypoints.at(-1)
		? {
				point: computedWaypoints.at(-1)!.coordinates,
				title: (
					<div className={s.waypoint}>
						{orderType === OrderType.pickpoint && meta?.pickpoint
							? t('Pickpoint #{{id}}', { id: meta.pickpoint })
							: t(
									computedWaypoints[
										computedWaypoints.length - 1
									].description
								)}
					</div>
				),
				color: 'var(--color-route-destination)'
			}
		: null;

	const remainingData =
		subRoutes?.remainingRouteData ?? subRoutes?.plannedRouteData;

	const remainingDriverIndex = useMemo(() => {
		if (
			!driverCoordinates ||
			orderState === OrderState.new ||
			!remainingData ||
			remainingData.points.length < 2
		)
			return 0;

		const index = findNearestIndex(
			remainingData.points,
			driverCoordinates as Point
		);

		if (index === null) return 0;

		return index;
	}, [driverCoordinates, orderState, remainingData]);

	const remainingRoutePoints = useMemo(
		() => remainingData?.points.slice(remainingDriverIndex) ?? [],
		[remainingData, remainingDriverIndex]
	);

	const [arrivalRoutePoints, actualRoutePoints] = useMemo(() => {
		if (!subRoutes?.actualRouteData) return [[], []];

		const remainingStartIndex = findNearestIndex(
			remainingData?.points ?? [],
			subRoutes.actualRouteData.points.at(-1) as Point
		);

		let arrivalPoints: Point[] = [];
		let actualPoints = subRoutes.actualRouteData.points
			.concat(
				remainingData
					? remainingData.points.slice(
							remainingStartIndex ?? 0,
							remainingDriverIndex + 1
						)
					: []
			)
			.filter(Boolean);

		if (hidePastArrivalRoute && computedWaypoints?.[0]) {
			const index = findNearestIndex(
				actualPoints,
				computedWaypoints[0].coordinates
			);

			if (index === null) {
				arrivalPoints = actualPoints;
				actualPoints = [];
			} else {
				arrivalPoints = actualPoints.slice(0, index + 1);
				actualPoints = actualPoints.slice(index);
			}
		}

		return [arrivalPoints, actualPoints];
	}, [
		subRoutes?.actualRouteData,
		remainingData,
		remainingDriverIndex,
		driverCoordinates,
		computedWaypoints,
		hidePastArrivalRoute
	]);

	return (
		<>
			{!withoutDriverPoint && driverCoordinates && (
				<DriverPoint point={driverCoordinates} />
			)}
			{firstPoint && <OrderPoint {...firstPoint} />}
			{lastPoint && <OrderPoint {...lastPoint} />}
			{Boolean(arrivalRoutePoints?.length) && (
				<RouteMapFeature
					route={arrivalRoutePoints}
					driverIndexInRoute={arrivalRoutePoints.length}
					zIndex={1000}
					hidePastRoute
				/>
			)}
			{Boolean(actualRoutePoints?.length) && (
				<RouteMapFeature
					route={actualRoutePoints}
					driverIndexInRoute={actualRoutePoints.length}
					zIndex={1100}
				/>
			)}
			{Boolean(remainingRoutePoints?.length) && (
				<RouteMapFeature
					route={remainingRoutePoints}
					driverIndexInRoute={0}
					zIndex={1200}
				/>
			)}
		</>
	);
};

export default OrderRoute;
