import React from 'react';

import { LngLat, MapFeature } from '../../lib';
import { getFeatureGeometry, getFeatureStyle } from '../../utils/utils';

function getFeatureCoordinates(
	route: LngLat[],
	separatingIndex: number,
	isRemainingRoute?: boolean
) {
	if (separatingIndex === 0) {
		if (isRemainingRoute) {
			return route;
		} else {
			return [];
		}
	}

	if (separatingIndex === route.length - 1) {
		if (isRemainingRoute) {
			return [];
		} else {
			return route;
		}
	}

	if (isRemainingRoute) {
		return route.slice(separatingIndex);
	} else {
		return route.slice(0, separatingIndex + 1);
	}
}

interface Props {
	route: LngLat[];
	driverIndexInRoute?: number;
	hidePastRoute?: boolean;
	zIndex?: number;
}

const RouteMapFeature: React.FC<Props> = ({
	route,
	driverIndexInRoute = 0,
	hidePastRoute = false,
	zIndex = 1000
}) => {
	const remainingRoute = React.useMemo(() => {
		if (driverIndexInRoute === route.length - 1) {
			return;
		}

		return {
			geometry: getFeatureGeometry(
				getFeatureCoordinates(route, driverIndexInRoute ?? 0, true)
			),
			style: getFeatureStyle('#83C753', zIndex)
		};
	}, [route, driverIndexInRoute]);

	const pastRoute = React.useMemo(() => {
		if (driverIndexInRoute === 0) {
			return;
		}

		return {
			geometry: getFeatureGeometry(
				getFeatureCoordinates(route, driverIndexInRoute ?? 0)
			),
			style: getFeatureStyle('#808080', zIndex - 1)
		};
	}, [route, driverIndexInRoute]);

	return (
		<>
			{remainingRoute ? (
				<MapFeature
					geometry={remainingRoute.geometry}
					style={remainingRoute.style}
				/>
			) : null}
			{pastRoute && !hidePastRoute ? (
				<MapFeature
					geometry={pastRoute.geometry}
					style={pastRoute.style}
				/>
			) : null}
		</>
	);
};

export default RouteMapFeature;
