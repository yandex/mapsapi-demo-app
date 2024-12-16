import { useMemo } from 'react';
import { Query, useQueries } from '@tanstack/react-query';

import { OrderState, Point, RouteData } from '../../types';
import { LngLatBounds } from '../lib';
import { fetchJson } from '../lib/api';
import { bbox } from '../utils/utils';

interface Props {
	plannedQueryUrl: string;
	actualQueryUrl: string;
	remainingQueryUrl: string;
	arrivalQueryUrl?: string;
	fetchArgs?: Parameters<typeof fetchJson>[1];
	orderState?: keyof typeof OrderState;
	enabled?: boolean;
	actualRefetchInterval?: number;
	remainingRefetchInterval?: number;
}

export interface SubRoutesState {
	plannedRouteData?: RouteData | null;
	arrivalRouteData?: RouteData | null;
	remainingRouteData?: RouteData | null;
	actualRouteData?: RouteData | null;
}

export function useSubRoutes(props: Props): SubRoutesState {
	return useQueries({
		queries: [
			{
				enabled: props.enabled,
				queryKey: [props.plannedQueryUrl],
				queryFn: async () =>
					fetchJson<RouteData | null>(
						props.plannedQueryUrl,
						props.fetchArgs
					).then(response => response || null)
			},
			{
				enabled:
					props.enabled &&
					Boolean(props.arrivalQueryUrl) &&
					props.orderState !== OrderState.new,
				queryKey: [props.arrivalQueryUrl],
				queryFn: async () =>
					fetchJson<RouteData | null>(
						props.arrivalQueryUrl!,
						props.fetchArgs
					).then(response => response || null),
				refetchInterval: (query: Query<RouteData | null, unknown>) =>
					query.state.data ? undefined : 200
			},
			{
				enabled: props.enabled && props.orderState !== OrderState.new,
				queryKey: [props.actualQueryUrl],
				queryFn: async () =>
					fetchJson<RouteData | null>(
						props.actualQueryUrl,
						props.fetchArgs
					).then(response => response || null),
				refetchInterval: props.actualRefetchInterval ?? 990
			},
			{
				enabled: props.enabled && props.orderState !== OrderState.new,
				queryKey: [props.remainingQueryUrl],
				queryFn: async () =>
					fetchJson<RouteData | null>(
						props.remainingQueryUrl,
						props.fetchArgs
					).then(response => response || null),
				refetchInterval: props.remainingRefetchInterval ?? 1100
			}
		],
		combine: result => ({
			plannedRouteData: result[0].data,
			arrivalRouteData: result[1].data,
			actualRouteData: result[2].data,
			remainingRouteData: result[3].data
		})
	});
}

export function useSubRoutesBounds(
	subRoutes?: SubRoutesState,
	orderState?: keyof typeof OrderState,
	driverCoordinates?: Point
): LngLatBounds | undefined {
	return useMemo(() => {
		let points =
			orderState === 'accepted'
				? subRoutes?.plannedRouteData?.points.concat(
						subRoutes.arrivalRouteData?.points || []
					)
				: subRoutes?.plannedRouteData?.points;

		if (!points) return;

		if (driverCoordinates) {
			points = points.concat([driverCoordinates as Point]);
		}

		return bbox(points);
	}, [subRoutes?.plannedRouteData, subRoutes?.arrivalRouteData, orderState]);
}
