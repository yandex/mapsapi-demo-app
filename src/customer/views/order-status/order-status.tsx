import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import Alert from 'antd/lib/alert';
import ClockCircleOutlined from '@ant-design/icons/ClockCircleOutlined';

import type { OrderState } from '../../../types';
import type { CustomerOrder } from '../../pages/order-view/order-view';

import s from './order-status.module.css';

export const STATUSES: Record<keyof typeof OrderState, string> = {
	draft: 'Processing',
	new: 'New',
	accepted: 'Expect delivery',
	delivering: 'Delivering',
	delivered: 'Delivered',
	completed: 'Completed'
} as const;

export function OrderAddressStatus({
	state
}: {
	state: keyof typeof OrderState;
}) {
	const { t } = useTranslation();

	if (state === 'delivered' || state === 'completed') {
		return null;
	}

	return (
		<Alert
			className={s.alert}
			message={t(STATUSES[state] ?? state)}
			type="warning"
			icon={<ClockCircleOutlined />}
			showIcon
		/>
	);
}

const STATUSES_PICKPOINT = [
	'draft',
	'new',
	'accepted',
	'delivering',
	'delivered',
	'completed'
] as const;

export function OrderPickpointStatus({
	state
}: {
	state: keyof typeof OrderState;
}) {
	const { t } = useTranslation();

	const statusIndex = STATUSES_PICKPOINT.indexOf(state);
	return (
		<div className={s.pickpoint}>
			{STATUSES_PICKPOINT.map((status, index) => (
				<div
					key={status}
					className={classNames(s.item, {
						[s.active]: statusIndex >= index
					})}
				>
					{t(STATUSES[status])}
				</div>
			))}
		</div>
	);
}

export function OrderStatus({ order }: { order: CustomerOrder }) {
	switch (order.type) {
		case 'pickpoint':
			return <OrderPickpointStatus state={order.state} />;

		default:
			return <OrderAddressStatus state={order.state} />;
	}
}
