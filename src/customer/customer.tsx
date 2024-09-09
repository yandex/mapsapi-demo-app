import * as React from 'react';
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Loading } from '../common/loading/loading';

import { DeliveryComplete } from './pages/delivery-complete/delivery-complete';
import { DeliveryPick } from './pages/delivery-pick/delivery-pick';
import { DeliveryPreorder } from './pages/delivery-preorder/delivery-preorder';
import { DeliveryStatus } from './pages/delivery-status/delivery-status';
import { OrderPage } from './pages/order/order';
import { OrderViewPage } from './pages/order-view/order-view';
import { PreOrderPage } from './pages/preorder/preorder';
import { DeliveryLayout } from './views/delivery-layout/delivery-layout';

export function CustomerApp(props: { type: string }) {
	const IndexPage =
		props.type === 'delivery' ? DeliveryPreorder : PreOrderPage;
	return (
		<MemoryRouter>
			<Routes>
				<Route path="/" element={<IndexPage />} />
				<Route path="/order/:id" element={<OrderPage />} />
				<Route path="/order/view/:id" element={<OrderViewPage />} />
				<Route
					path="/delivery/:id"
					element={
						<React.Suspense fallback={<Loading />}>
							<DeliveryLayout />
						</React.Suspense>
					}
				>
					<Route
						path="pick"
						element={
							<React.Suspense>
								<DeliveryPick />
							</React.Suspense>
						}
					/>
					<Route path="status" element={<DeliveryStatus />} />
					<Route path="complete" element={<DeliveryComplete />} />
				</Route>
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</MemoryRouter>
	);
}
