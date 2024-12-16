import React, { startTransition } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';

import { Driver, Mode } from '../../types';
import Drawer from '../../views/drawer';
import DriverView from '../../views/driver-view/driver-view';
import { DriversList } from '../drivers-list/drivers-list';
import { DriversMap } from '../drivers-map/drivers-map';

const LIST_POLL_INTERVAL = 1000;

export interface DriverListResponse {
	hasMore: boolean;
	items: Driver[];
}

const Drivers: React.FC = () => {
	const { mode } = useOutletContext<{ mode: Mode }>();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [activeDriverId, setActiveDriverId] = React.useState<number>();
	const { data } = useSuspenseQuery<DriverListResponse>({
		queryKey: ['/manager/drivers'],
		queryFn: async () =>
			fetch('/api/manager/drivers').then(response => response.json()),
		refetchInterval: LIST_POLL_INTERVAL
	});

	const onDriverClick = React.useCallback((id: number) => {
		startTransition(() => {
			setActiveDriverId(id);
		});
	}, []);

	const onDriverViewClose = React.useCallback(() => {
		setActiveDriverId(undefined);
	}, []);

	const Component = mode === 'list' ? DriversList : DriversMap;
	return (
		<>
			<Component {...data} onDriverClick={onDriverClick} />
			<Drawer open={Boolean(activeDriverId)} onClose={onDriverViewClose}>
				{activeDriverId ? (
					<DriverView id={activeDriverId} onClose={onDriverViewClose} />
				) : null}
			</Drawer>
		</>
	);
};

export default Drivers;
