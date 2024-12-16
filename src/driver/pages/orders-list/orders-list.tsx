import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';

import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';

import { fetchJson } from '../../../common/lib/api';
import { ListItemStatus } from '../../../common/views/list-item-status';
import { ListLayout } from '../../../common/views/list-layout';
import { Order } from '../../../types';
import { getHeaders, orderStateToStatus } from '../../utils';
import { NewOrderList } from '../../views/new-order-list';

import s from './orders-list.module.css';

export function OrdersListPage() {
	const { t } = useTranslation();

	const params = useParams<{ driverId: string }>();
	const navigate = useNavigate();
	const headers = getHeaders(params.driverId!);

	const { data: newOrders } = useSuspenseQuery({
		queryKey: ['/driver/orders/available'],
		queryFn: async () =>
			await fetchJson<Order[]>('/api/driver/orders/available', {
				headers
			}),
		refetchInterval: 500
	});

	const { data: pastOrders } = useSuspenseQuery({
		queryKey: ['/driver/orders/history'],
		queryFn: async () =>
			await fetchJson<Order[]>('/api/driver/orders/history', {
				headers
			}),
		refetchInterval: 500
	});

	const accept = useCallback(async (id: number) => {
		const { ok } = await fetchJson<{ ok: boolean }>(
			`/api/driver/orders/${id}/accept`,
			{
				method: 'POST',
				headers
			}
		);

		if (ok) {
			navigate(`/drivers/${params.driverId}/orders/${id}`);
		}
	}, []);

	const decline = useCallback(
		(id: number) =>
			fetchJson(`/api/driver/orders/${id}/decline`, {
				method: 'POST',
				headers
			}),
		[]
	);

	return (
		<Flex className={s['layout']} gap={20} vertical>
			<Flex vertical>
				<Typography.Title level={3} className={s['title']}>
					{t('New orders')}
				</Typography.Title>
				{newOrders.length !== 0 ? (
					<NewOrderList
						orders={newOrders}
						onAccept={accept}
						onDecline={decline}
						getCardLinkTo={(id: number) =>
							`/drivers/${params.driverId}/orders/${id}`
						}
					/>
				) : (
					<ListLayout dataSource={undefined} />
				)}
			</Flex>
			<Flex vertical>
				<Typography.Title level={3} className={s['title']}>
					{t('Past orders')}
				</Typography.Title>
				<ListLayout
					dataSource={pastOrders}
					renderItem={order => (
						<ListItemStatus
							date={new Date(order.created_at)}
							title={t('Order #{{id}}', { id: order.id })}
							status={{ ...orderStateToStatus[order.state]! }}
						/>
					)}
				/>
			</Flex>
		</Flex>
	);
}
