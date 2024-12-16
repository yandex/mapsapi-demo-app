import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';
import ArrowRightOutlined from '@ant-design/icons/ArrowRightOutlined';

import { DrivingInfoTable } from '../../../common/views/driving-info-table';
import { OrderStatus } from '../../../common/views/order-status';
import { Order } from '../../../types';
import { orderStateToStatus } from '../../utils';

import s from './index.module.css';

interface NewOrderItemProps {
	order: Order;
	onDeclineClick: () => void;
	onAcceptClick: () => void;
	linkTo: string;
}

export function NewOrderItem({
	order,
	onDeclineClick,
	onAcceptClick,
	linkTo
}: NewOrderItemProps) {
	const { t } = useTranslation();

	return (
		<Card size="small">
			<Flex vertical gap="middle">
				<Link to={linkTo}>
					<Flex vertical gap="middle">
						<Flex vertical gap="small">
							<Flex justify="space-between" align="center">
								<Typography.Title level={5}>
									{t('Order #{{id}}', { id: order.id })}
								</Typography.Title>
								<OrderStatus {...orderStateToStatus['new']!} />
							</Flex>
							<Flex wrap="wrap" gap="small" align="center">
								<Typography.Text>
									{t(order.waypoints[0].description)}
								</Typography.Text>
								<ArrowRightOutlined
									className={s['arrow-icon']}
								/>
								<Typography.Text>
									{t(order.waypoints[1].description)}
								</Typography.Text>
							</Flex>
						</Flex>
						<DrivingInfoTable
							time={order.plannedRouteMeta!.duration}
							distance={order.plannedRouteMeta!.distance}
							surge={order.meta.surge!}
						/>
					</Flex>
				</Link>
				<Flex gap="small">
					<Button block onClick={onDeclineClick}>
						{t('Reject')}
					</Button>
					<Button block onClick={onAcceptClick} type="primary">
						{t('Accept')}
					</Button>
				</Flex>
			</Flex>
		</Card>
	);
}
