import React from 'react';
import { useTranslation } from 'react-i18next';

import Flex from 'antd/lib/flex';
import List from 'antd/lib/list';
import Typography from 'antd/lib/typography';

import { OrderStatus } from '../../../common/views/order-status';
import { Order, OrderStatusColor, OrderStatusTitle } from '../../types';
import { DeliveryType } from '../delivery-type';
import { DriverMiniCard } from '../driver-mini-card';

import s from './order-list-item.module.css';

export type OrdersListItemProps = {
	itemInfo: Order;
	onClick?(): void;
};

export const OrdersListItem: React.FC<OrdersListItemProps> = ({
	itemInfo,
	onClick
}: OrdersListItemProps) => {
	const { t } = useTranslation();

	return (
		<List.Item
			style={{
				padding: 'var(--paddings-size-s) var(--paddings-size-m)',
				cursor: 'pointer'
			}}
			onClick={onClick}
		>
			<Flex
				align="center"
				justify="space-between"
				className={s['first-line']}
			>
				<Flex
					align="flex-start"
					justify="space-between"
					gap={12}
					style={{ width: '100%' }}
				>
					<Typography.Text className={s['title']}>
						{t('Order #{{id}}', { id: itemInfo.order.id })}
					</Typography.Text>
					<Flex align="center">
						<DeliveryType
							type={itemInfo.order.meta.deliveryType ?? 'usual'}
						/>
						<OrderStatus
							text={OrderStatusTitle[itemInfo.order.state]}
							type={OrderStatusColor[itemInfo.order.state]}
						/>
					</Flex>
				</Flex>
			</Flex>
			<Flex>
				<DriverMiniCard
					name={itemInfo.driver?.name}
					avatar={itemInfo.driver?.avatar}
				/>
			</Flex>
		</List.Item>
	);
};
