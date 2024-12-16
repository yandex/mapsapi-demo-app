import React from 'react';
import { useTranslation } from 'react-i18next';

import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';

import { ListItemStatus } from '../../../common/views/list-item-status';
import { ListLayout } from '../../../common/views/list-layout';
import { OrderState } from '../../../types';
import { Order } from '../../types';
import { OrdersListItem } from '../../views/order-list-item/order-list-item';
import { OrderListResponse } from '../orders/orders';

import s from './orders-list.module.css';

interface Props extends OrderListResponse {
	onOrderClick(orderId: number): void;
}

const OrdersList: React.FC<Props> = ({ items, onOrderClick }) => {
	const { t } = useTranslation();

	const newOrders: Order[] = [];
	const unavailableOrders: Order[] = [];

	items.forEach(item => {
		const { state } = item.order;
		state !== OrderState.completed
			? newOrders.push(item)
			: unavailableOrders.push(item);
	});

	const renderActualOrder = React.useCallback(
		(item: Order) => (
			<OrdersListItem
				itemInfo={item}
				onClick={() => onOrderClick(item.order.id)}
			/>
		),
		[onOrderClick]
	);

	const renderPastOrder = React.useCallback(
		(item: Order) => (
			<ListItemStatus
				date={new Date(item.order.created_at)}
				title={t(`Order #{{id}}`, { id: item.order.id })}
				status={{ text: 'Completed', type: 'info' }}
				onClick={() => onOrderClick(item.order.id)}
			/>
		),
		[onOrderClick]
	);

	return (
		<Flex className={s['list-layout']} gap={20} vertical>
			<Flex vertical>
				<Typography.Title level={3} className={s['title']}>
					{t('New items')}
				</Typography.Title>
				<ListLayout
					itemLayout="vertical"
					dataSource={newOrders}
					renderItem={renderActualOrder}
				/>
			</Flex>
			<Flex vertical>
				<Typography.Title level={3} className={s['title']}>
					{t('Last')}
				</Typography.Title>
				<ListLayout
					dataSource={unavailableOrders}
					renderItem={renderPastOrder}
				/>
			</Flex>
		</Flex>
	);
};

export default OrdersList;
