import React from 'react';
import { useTranslation } from 'react-i18next';

import Flex from 'antd/lib/flex';
import List from 'antd/lib/list';
import Typography from 'antd/lib/typography';

import { OrderStatus } from '../../../common/views/order-status';
import { Driver, ManagerOrderInfo } from '../../types';
import { getDriverStatus, isDriverWithoutOrder } from '../../utils/utils';
import { DeliveryType } from '../delivery-type';
import { DriverName } from '../driver-name';

import s from './index.module.css';

export type DriversListItemProps = {
	item: Driver;
	onClick(): void;
};

export const DriversListItem: React.FC<DriversListItemProps> = ({
	item,
	onClick
}: DriversListItemProps) => {
	return (
		<List.Item
			style={{padding: 'var(--paddings-size-s) var(--paddings-size-m)', cursor: 'pointer'}}
			onClick={onClick}
		>
			<Flex
				align="center"
				justify="space-between"
				className={s['first-line']}
			>
				<DriverName name={item.driver.name} avatar={item.driver.avatar} />
				<OrderStatus {...getDriverStatus(item.order)} />
			</Flex>
			<Flex>
				<OrderInfo order={isDriverWithoutOrder(item.order) ? undefined : item.order} />
			</Flex>
		</List.Item>
	);
};

const OrderInfo = (props: { order?: ManagerOrderInfo }) => {
	const { t } = useTranslation();

	if (props.order === undefined) {
		return (
			<Typography.Text className={s['order-info']}>
				{t('Awaiting order')}
			</Typography.Text>
		);
	}
	return (
		<Flex align="center" gap={8}>
			<Typography.Text className={s['order-name']}>
				{t('Order #{{id}}', { id: props.order.id })}
			</Typography.Text>
			<DeliveryType type={props.order.meta.deliveryType ?? 'usual'} />
		</Flex>
	);
};
