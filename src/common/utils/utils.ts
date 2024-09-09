import { Point } from '../../types';
import type { DrawingStyle, Geometry, LngLat, LngLatBounds } from '../lib';

export const seed = (s: number) => () => {
	s = Math.sin(s) * 10000;
	return s - Math.floor(s);
};

export const rnd = seed(10000);

export function bbox(points: LngLat[]): LngLatBounds {
	let minLat = Infinity;
	let maxLat = -Infinity;
	let minLng = Infinity;
	let maxLng = -Infinity;
	for (const point of points) {
		minLat = Math.min(minLat, point[1]);
		maxLat = Math.max(maxLat, point[1]);
		minLng = Math.min(minLng, point[0]);
		maxLng = Math.max(maxLng, point[0]);
	}
	return [
		[minLng, minLat],
		[maxLng, maxLat]
	];
}

export const getRandomPointInBbox = (bbox: [Point, Point]): Point => [
	bbox[0][0] + rnd() * (bbox[1][0] - bbox[0][0]),
	bbox[1][1] - rnd() * (bbox[1][1] - bbox[0][1])
];

export function getFeatureGeometry(coordinates: LngLat[]): Geometry {
	return {
		type: 'LineString',
		coordinates
	};
}

export function getFeatureStyle(color: string, zIndex: number): DrawingStyle {
	return {
		stroke: [
			{
				color,
				width: 8,
				opacity: 0.8
			}
		],
		simplificationRate: 0,
		zIndex
	};
}
