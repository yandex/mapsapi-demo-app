import * as turf from '@turf/turf';

import { Point, RouteData } from '../../types';

export function correctRouteData(
	data: RouteData,
	correctPoints: (points: Point[]) => Point[]
): RouteData {
	const distanceMultiplier = data.meta.distance / data.points.length;
	const durationMultiplier = data.meta.duration / data.points.length;

	const points = correctPoints(data.points);

	return {
		...data,
		points,
		meta: {
			...data.meta,
			duration: points.length * durationMultiplier,
			distance: points.length * distanceMultiplier
		}
	};
}

export const NEAR_METERS = 0.5;
export function findNearestIndex(line: Point[], point: Point): number | null {
	if (!point) return null;
	let nearestPoint: { distance: number; index: number | null } = {
		distance: Infinity,
		index: null
	};

	for (let i = 0; i < line.length - 1; i++) {
		const isLastSegment = i === line.length - 2;
		const lineSegment = turf.lineString([line[i], line[i + 1]]);

		const distance = turf.pointToLineDistance(point, lineSegment, {
			units: 'meters'
		});

		if (distance < NEAR_METERS) {
			if (distance < nearestPoint.distance) {
				nearestPoint = { distance, index: i };
			}

			if (isLastSegment && distance <= nearestPoint.distance) {
				nearestPoint = { distance, index: i + 1 };
			}
		}
	}

	return nearestPoint.index;
}
