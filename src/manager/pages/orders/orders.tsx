import React, { startTransition } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';

import { Mode, Order } from '../../types';
import Drawer from '../../views/drawer';
import OrderView from '../../views/order-view/order-view';
import OrdersList from '../orders-list/orders-list';
import { OrdersMap } from '../orders-map/orders-map';

const LIST_POLL_INTERVAL = 1000;

export interface OrderListResponse {
	hasMore: boolean;
	items: Order[];
}

const Orders: React.FC = () => {
	const { mode } = useOutletContext<{ mode: Mode }>();
	const [activeOrderId, setActiveOrderId] = React.useState<number>();
	const { data } = useSuspenseQuery<OrderListResponse>({
		queryKey: ['/manager/orders'],
		queryFn: async () =>
			fetch('/api/manager/orders').then(response => response.json()),
		refetchInterval: LIST_POLL_INTERVAL
	});

	const onOrderClick = (id: number) => {
		startTransition(() => {
			setActiveOrderId(id);
		});
	};

	const onOrderInfoClose = React.useCallback(() => {
		setActiveOrderId(undefined);
	}, []);

	const Component = mode === 'list' ? OrdersList : OrdersMap;
	return (
		<>
			<Component {...data} onOrderClick={onOrderClick} />

			<Drawer open={Boolean(activeOrderId)} onClose={onOrderInfoClose}>
				{activeOrderId ? (
					<OrderView id={activeOrderId} onClose={onOrderInfoClose} />
				) : null}
			</Drawer>
		</>
	);
};

export default Orders;
