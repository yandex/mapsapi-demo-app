import React from 'react';

import { MapProps } from '../../../common/lib';
import { bbox } from '../../../common/utils/utils';
import { MapLayout } from '../../../common/views/map-layout/map-layout';
import { DriverState, OrderState } from '../../../types';
import { Driver } from '../../types';
import { AnimatedDriverMarker, DriverMarkerProps } from '../../views/driver-marker';
import { DriverListResponse } from '../drivers/drivers';

const MAP_MARGIN: MapProps['margin'] = [100, 100, 100, 100];

const getMarkerProps = (items: Driver[]): DriverMarkerProps[] => {
	return items
		.filter(({ driver }) => {
			return driver.state === DriverState.working && driver.position;
		})
		.map<DriverMarkerProps>(({ driver, order }) => {
			return {
				driverId: driver.id,
				name: driver.name,
				coordinates: driver.position,
				avatar: driver.avatar,
				delivering:
					order !== undefined &&
					order.state !== OrderState.delivered &&
					order.state !== OrderState.completed
			};
		});
};

interface Props extends DriverListResponse {
	onDriverClick(driverId: number): void;
}

export const DriversMap: React.FC<Props> = props => {
	const location = React.useMemo(() => {
		const markerProps = getMarkerProps(props.items);
		const coordinates = markerProps.map(p => p.coordinates);
		return coordinates.length === 0
			? undefined
			: coordinates.length === 1
				? { center: coordinates[0], zoom: 12 }
				: { bounds: bbox(coordinates) };
	}, []);

	const markerProps = React.useMemo(
		() => getMarkerProps(props.items),
		[props.items]
	);

	return (
		<MapLayout location={location} margin={MAP_MARGIN}>
			{markerProps.map(marker => (
				<AnimatedDriverMarker
					{...marker}
					key={marker.driverId}
					onClick={props.onDriverClick}
				/>
			))}
		</MapLayout>
	);
};
