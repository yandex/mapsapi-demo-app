import React from 'react';

import { LngLat, LngLatBounds, MapMarker } from '../../../common/lib';
import { bbox } from '../../../common/utils/utils';

import s from './index.module.css';

interface Props {
	coordinates: LngLat;
	featuresCoordinates: LngLat[];
	onClusterClick: (bounds: LngLatBounds) => void;
}

export const OrderMarkerCluster: React.FC<Props> = ({
	featuresCoordinates,
	coordinates,
	onClusterClick
}) => {
	const onMarkerClick = React.useCallback(() => {
		const bounds = bbox(featuresCoordinates);
		onClusterClick(bounds);
	}, [featuresCoordinates, onClusterClick]);

	return (
		<MapMarker coordinates={coordinates} onFastClick={onMarkerClick}>
			<div className={s['icon']}>{featuresCoordinates.length}</div>
		</MapMarker>
	);
};
