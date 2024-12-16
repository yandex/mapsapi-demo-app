import React, { Suspense } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Loading } from '../common/loading/loading';

import Drivers from './pages/drivers/drivers';
import Orders from './pages/orders/orders';
import ManagerLayout from './views/layout/layout';
import { routes } from './types';

export const ManagerApp: React.FC = () => {
	return (
		<MemoryRouter>
			<Routes>
				<Route element={<ManagerLayout />}>
					<Route
						path={routes.orders}
						element={
							<Suspense fallback={<Loading size="large" />}>
								<Orders />
							</Suspense>
						}
					/>
					<Route
						path={routes.drivers}
						element={
							<Suspense fallback={<Loading size="large" />}>
								<Drivers />
							</Suspense>
						}
					/>
					<Route path="*" element={<Navigate to={routes.orders} />} />
				</Route>
			</Routes>
		</MemoryRouter>
	);
};
