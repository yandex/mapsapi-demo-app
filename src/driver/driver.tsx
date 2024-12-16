import React, { Suspense } from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

import { MapProps } from '../common/lib';
import { Loading } from '../common/loading/loading';
import { MapLayout } from '../common/views/map-layout/map-layout';

import { OrderPage } from './pages/order/order';
import { OrdersListPage } from './pages/orders-list/orders-list';
import { PreDriver } from './pages/predriver/predriver';

const MAP_MARGIN: MapProps['margin'] = [50, 50, 360, 50];

export function DriverApp() {
	return (
		<MemoryRouter>
			<Routes>
				<Route path="/" element={<PreDriver />} />
				<Route
					path="/drivers/:driverId/orders"
					element={
						<Suspense fallback={<Loading />}>
							<OrdersListPage />
						</Suspense>
					}
				/>
				<Route
					path="/drivers/:driverId/orders/:orderId"
					element={
						<MapLayout margin={MAP_MARGIN}>
							<Suspense fallback={<Loading />}>
								<OrderPage />
							</Suspense>
						</MapLayout>
					}
				/>
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</MemoryRouter>
	);
}
