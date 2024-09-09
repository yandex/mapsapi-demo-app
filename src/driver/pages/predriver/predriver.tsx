import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import avatarImg from '../../../common/images/FrankMartin.png'
import { fetchJson } from '../../../common/lib/api';
import { Loading } from '../../../common/loading/loading';
import { getRandomPointInBbox } from '../../../common/utils/utils';
import { Driver, DriverState, Point } from '../../../types';
import { getHeaders } from '../../utils';

export function PreDriver() {
	const { isLoading, data } = useQuery({
		queryKey: ['/driver/create'],
		queryFn: async () => {
			const driver = await fetchJson<Driver>('/api/driver/self', {
				method: 'POST',
				body: { name: 'Frank Martin', state: DriverState.working, avatar: avatarImg }
			});
			// enable geolocation mock
			const geolocationMock = mockGeolocationApi();

			const position = await getCurrentPositionPromise();
			const positionCoordinates: Point = [
				position.coords.longitude,
				position.coords.latitude
			];
			const headers = getHeaders(driver.id);

			await fetchJson(`/api/driver/track`, {
				method: 'post',
				headers,
				body: { position: positionCoordinates }
			});

			// disable geolocation mock
			geolocationMock.reset();

			return driver;
		}
	});

	return isLoading ? (
		<Loading />
	) : (
		<Navigate to={`/drivers/${data!.id}/orders`} />
	);
}

const getCurrentPositionPromise = () => {
	return new Promise<GeolocationPosition>(resolve => {
		navigator.geolocation.getCurrentPosition(position => {
			resolve(position);
		});
	});
};

/** mock geolocation only for demo app */
const mockGeolocationApi = () => {
	const getCurrentPositionOriginal = navigator.geolocation.getCurrentPosition;

	// monkey patch getCurrentPosition ¯\_(ツ)_/¯
	navigator.geolocation.getCurrentPosition = cb => {
		fetchJson<{ bbox: [Point, Point] }>('/api/config').then(({ bbox }) => {
			const position = getRandomPointInBbox(bbox);
			cb({
				coords: {
					longitude: position[0],
					latitude: position[1]
				}
			} as GeolocationPosition);
		});
	};

	return {
		reset() {
			navigator.geolocation.getCurrentPosition =
				getCurrentPositionOriginal;
		}
	};
};
