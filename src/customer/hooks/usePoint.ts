import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '../../common/lib/api';
import { GeocodeResult } from '../../types';

export function usePoint(
	initialPoint: Partial<GeocodeResult>
): [
	Partial<GeocodeResult>,
	React.Dispatch<React.SetStateAction<Partial<GeocodeResult>>>
] {
	const [point, setPoint] = React.useState(initialPoint);

	const serverPoint = useQuery({
		enabled: Boolean(point.coordinates && !point.name),
		queryKey: ['point', point.name, point.coordinates?.join(',')],
		queryFn: () =>
			fetchJson<GeocodeResult>(
				`/api/user/search?point=${encodeURIComponent(point.coordinates!.join(','))}`
			)
	});

	const cachedPoint = React.useMemo(
		() => ({ ...point, name: serverPoint.data?.name || point.name }),
		[point, serverPoint.data]
	);

	return [cachedPoint, setPoint];
}
