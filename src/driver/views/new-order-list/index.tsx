import React from 'react';

import Flex from 'antd/lib/flex';

import { Order } from '../../../types';

import { NewOrderItem } from './new-order-item';

interface NewOrderListProps {
	orders: Order[];
	onAccept: (id: number) => void;
	onDecline: (id: number) => void;
	getCardLinkTo: (id: number) => string;
}

export function NewOrderList({
	orders,
	onAccept,
	onDecline,
	getCardLinkTo
}: NewOrderListProps) {
	return (
		<Flex vertical gap="small">
			{orders.slice(0, 2).map(order => (
				<NewOrderItem
					key={order.id}
					order={order}
					onDeclineClick={() => onDecline(order.id)}
					onAcceptClick={() => onAccept(order.id)}
					linkTo={getCardLinkTo(order.id)}
				/>
			))}
		</Flex>
	);
}
