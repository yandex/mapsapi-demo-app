import React from 'react';
import { useTranslation } from 'react-i18next';

import Button from 'antd/lib/button';
import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import MoreOutlined from '@ant-design/icons/MoreOutlined';
import NodeIndexOutlined from '@ant-design/icons/NodeIndexOutlined';

import { openDemoDialog } from '../../../common/utils/app-utils';
import { AddressesList } from '../../../common/views/addresses-list';
import { DrivingInfoTable } from '../../../common/views/driving-info-table';
import { OrderStatus } from '../../../common/views/order-status';
import type { Order } from '../../../types';
import { orderStateToStatus } from '../../utils';

import s from './index.module.css';

type DriverViewState =
	| 'arrivingStarted'
	| 'arrivingFinished'
	| 'navigationStarted'
	| 'navigationFinished';

export type DeliveringState = Order['state'] | DriverViewState;

type OrderCardProps = {
	order: Order;
	progress: {
		time: number;
		distance: number;
	};
	deliveringState: DeliveringState;
	onAcceptClick: () => void;
	onDeclineClick: () => void;
	onTakeClick: () => void;
	onNavigateClick: () => void;
	onDeliverClick: () => void;
	onStartClick: () => void;
};

export const OrderCard = React.memo(function OrderCard({
	order,
	progress,
	deliveringState,
	onAcceptClick,
	onDeclineClick,
	onTakeClick,
	onNavigateClick,
	onDeliverClick,
	onStartClick
}: OrderCardProps) {
	const { t } = useTranslation();

	const orderStatusProps = orderStateToStatus[order.state];

	if (!orderStatusProps) return;

	return (
		<Flex gap="middle" vertical>
			<Flex justify="space-between">
				<Typography.Title level={4}>
					{t('Order #{{id}}', { id: order.id })}
				</Typography.Title>
				<OrderStatus {...orderStatusProps} />
			</Flex>
			<DrivingInfoTable
				time={progress.time}
				distance={progress.distance}
				surge={order.meta.surge!}
			/>
			<AddressesList
				addresses={order.waypoints.map(info => ({
					title: t(info.description),
					onClick: () => {}
				}))}
			/>
			{deliveringState === 'new' && (
				<Flex gap="small">
					<Button block onClick={onDeclineClick}>
						{t('Reject')}
					</Button>
					<Button block onClick={onAcceptClick} type="primary">
						{t('Accept')}
					</Button>
				</Flex>
			)}
			{deliveringState === 'accepted' && (
				<Flex gap="small" className={s.buttons}>
					<Button
						type="default"
						block
						onClick={onStartClick}
						style={{ flex: 1 }}
					>
						<NodeIndexOutlined />
						{t('Navigate')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						{t('Help')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						<MoreOutlined />
					</Button>
				</Flex>
			)}
			{['arrivingStarted', 'arrivingFinished'].includes(
				deliveringState
			) && (
				<Flex gap="small" className={s.buttons}>
					<Button
						type="default"
						block
						onClick={onTakeClick}
						disabled={deliveringState === 'arrivingStarted'}
						style={{ flex: 1 }}
					>
						{t('I have the package')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						<MessageOutlined /> {t('Chat')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						<MoreOutlined />
					</Button>
				</Flex>
			)}
			{deliveringState === 'delivering' && (
				<Flex gap="small" className={s.buttons}>
					<Button
						type="default"
						block
						onClick={onNavigateClick}
						style={{ flex: 1 }}
					>
						<NodeIndexOutlined />
						{t('Navigate')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						{t('Help')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						<MoreOutlined />
					</Button>
				</Flex>
			)}
			{deliveringState === 'navigationStarted' && (
				<Flex gap="small" className={s.buttons}>
					<Button
						type="default"
						block
						disabled
						onClick={onDeliverClick}
						style={{ flex: 1 }}
					>
						{t('On my way')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						{t('Help')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						<MoreOutlined />
					</Button>
				</Flex>
			)}
			{deliveringState === 'navigationFinished' && (
				<Flex gap="small" className={s.buttons}>
					<Button
						type="default"
						block
						onClick={onDeliverClick}
						style={{ flex: 1 }}
					>
						{t('Parcel delivered')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						{t('Help')}
					</Button>
					<Button onClick={openDemoDialog} type="default">
						<MoreOutlined />
					</Button>
				</Flex>
			)}
		</Flex>
	);
});
