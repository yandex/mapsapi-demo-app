import React, { startTransition, Suspense, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';

import Button from 'antd/lib/button';
import Typography from 'antd/lib/typography';

import {
	useSubRoutes,
	useSubRoutesBounds
} from '../../../common/hooks/useSubRoutes';
import { fetchJson } from '../../../common/lib/api';
import { Loading } from '../../../common/loading/loading';
import { openDemoDialog } from '../../../common/utils/app-utils';
import {
	MapLayout,
	MapStaticLayout
} from '../../../common/views/map-layout/map-layout';
import OrderRoute from '../../../common/views/order-route';
import { Driver, Order, OrderState, OrderType, Point } from '../../../types';
import { OrderStatus } from '../../views/order-status/order-status';
import { PaymentAnimation } from '../../views/payment-animation/payment-animation';
import { PseudoDrawer } from '../../views/pseudo-drawer/pseudo-drawer';

import s from './order-view.module.css';

export interface CustomerOrder extends Order {
	position?: Point;
	driver?: Driver;
}

const MARGIN = [80, 80, 80, 80] as [number, number, number, number];

function OrderView() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [confirmation, setConfirmation] = React.useState(false);
	const [tick, setTick] = React.useState(0);

	const { data: order } = useSuspenseQuery({
		refetchInterval: 400,
		queryKey: ['orderStatus', id, tick],
		queryFn: () => fetchJson<CustomerOrder>('/api/user/orders/' + id)
	});

	const subRoutes = useSubRoutes({
		plannedQueryUrl: `/api/user/orders/${id}/routes/planned`,
		actualQueryUrl: `/api/user/orders/${id}/routes/actual`,
		remainingQueryUrl: `/api/user/orders/${id}/routes/remaining`,
		orderState: order.state,
		enabled:
			order.type !== OrderType.pickpoint &&
			order.state !== OrderState.completed
	});

	const bounds = useSubRoutesBounds(subRoutes, order.state, order.position);
	const location = useMemo(
		() =>
			order.type !== OrderType.pickpoint
				? bounds
					? { bounds }
					: undefined
				: {
						center: order.waypoints[1].coordinates,
						zoom: 15
					},
		[bounds]
	);

	const confirmPickupDelivery = useCallback(async () => {
		setConfirmation(true);
		await fetchJson<CustomerOrder>(`/api/user/orders/${id}/confirm`, {
			method: 'POST'
		});
		startTransition(() => {
			setConfirmation(false);
			setTick(tick => tick + 1);
		});
	}, [id]);

	return (
		<div className={s.status}>
			<div className={s.map}>
				{order.type !== OrderType.pickpoint
					? subRoutes &&
						location && (
							<MapLayout
								margin={MARGIN}
								location={location}
								mode="vector"
							>
								<OrderRoute
									driverCoordinates={order.position}
									orderType={order.type}
									orderState={order.state}
									meta={order.meta}
									subRoutes={subRoutes}
									hidePastArrivalRoute
								/>
							</MapLayout>
						)
					: location && (
							<MapStaticLayout
								point={t(`Pickpoint #{{id}}`, {
									id: order.meta.pickpoint
								})}
								location={location}
							/>
						)}
			</div>

			<PseudoDrawer>
				<div className={s.info}>
					<div className={s.description}>
						<Typography.Title className={s.title} level={3}>
							{t(`Order #{{id}} {{state}}`, {
								id: order.id,
								state:
									order.state === OrderState.completed
										? t('Delivered')
										: ''
							})}{' '}
						</Typography.Title>
						<Typography.Text>
							{order.waypoints[1].description}
						</Typography.Text>

						<OrderStatus order={order} />

						{order.state === OrderState.delivered && (
							<Button
								disabled={confirmation}
								onClick={confirmPickupDelivery}
								className={s.next}
								type={'primary'}
								size={'large'}
							>
								{t('Order received')}
							</Button>
						)}

						{order.state === OrderState.completed && (
							<Button
								onClick={() => navigate('/')}
								className={s.next}
								type={'primary'}
								size={'large'}
							>
								{t('Place another order')}
							</Button>
						)}
					</div>
					<div className={s.additional}>
						<div>
							<div className={s.sum}>
								{t('Goods worth {{cost, currency}}', {
									cost: order.meta.totalAmount
								})}
							</div>
							<div className={s.subtitle}>
								{t('goods {{count}}', {
									count: order.meta.products.length
								})}
							</div>
						</div>
						<div>
							<Button
								onClick={openDemoDialog}
								size={'small'}
								type={'default'}
							>
								{t('Details')}
							</Button>
						</div>
					</div>
				</div>
			</PseudoDrawer>
		</div>
	);
}

export function OrderViewPage() {
	return (
		<PaymentAnimation>
			<Suspense fallback={<Loading />}>
				<OrderView />
			</Suspense>
		</PaymentAnimation>
	);
}
