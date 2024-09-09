import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';

import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';
import CloseOutlined from '@ant-design/icons/CloseOutlined';

import {
	useSubRoutes,
	useSubRoutesBounds
} from '../../../common/hooks/useSubRoutes';
import { MapProps } from '../../../common/lib';
import { fetchJson } from '../../../common/lib/api';
import { formatTime } from '../../../common/time/time';
import { AddressesList } from '../../../common/views/addresses-list';
import { DrivingInfoTable } from '../../../common/views/driving-info-table';
import { MapLayout } from '../../../common/views/map-layout/map-layout';
import OrderRoute from '../../../common/views/order-route';
import { OrderStatus } from '../../../common/views/order-status';
import { OrderState } from '../../../types';
import { Order, OrderStatusColor, OrderStatusTitle } from '../../types';
import { DeliveryType } from '../delivery-type';
import { DriverMarker } from '../driver-marker';
import { DriverMiniCard } from '../driver-mini-card';

import s from './order-view.module.css';

const MAP_MARGIN: MapProps['margin'] = [70, 45, 20, 45];

interface Props {
	id: number;
	onClose: () => void;
}

const SECONDS_IN_MINUTE = 60;
const MILLISECONDS_IN_SECOND = 1000;
const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE;
const NEAR_TIME = 60;

const OrderView: React.FC<Props> = ({ id, onClose }) => {
	const { t } = useTranslation();
	const { data } = useSuspenseQuery<Order>({
		queryKey: ['/manager/orders', id],
		queryFn: async () => fetchJson(`/api/manager/orders/${id}`),
		refetchInterval: ({ state: { data } }) =>
			data?.order.state === OrderState.completed ? false : 400
	});
	const [waitingTime, setWaitingTime] = React.useState<number>(
		() =>
			(new Date().getTime() - new Date(data.order.created_at).getTime()) /
			1000
	);

	const subRoutes = useSubRoutes({
		plannedQueryUrl: `/api/manager/orders/${id}/routes/planned`,
		arrivalQueryUrl: `/api/manager/orders/${id}/routes/arrival`,
		actualQueryUrl: `/api/manager/orders/${id}/routes/actual`,
		remainingQueryUrl: `/api/manager/orders/${id}/routes/remaining`,
		orderState: data.order.state,
		enabled: true
	});

	const bounds = useSubRoutesBounds(
		subRoutes,
		data.order.state,
		data.driver?.position
	);
	const location = React.useMemo(
		() => (bounds ? { bounds } : undefined),
		[bounds]
	);

	React.useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		if (data.order.state === OrderState.new) {
			const exec = () => {
				timeoutId = setTimeout(() => {
					setWaitingTime(prev => prev + SECONDS_IN_MINUTE);
					exec();
				}, MILLISECONDS_IN_MINUTE);
			};
			exec();
		}
		return () => clearTimeout(timeoutId);
	}, [data.order]);

	const progressInfo = React.useMemo(() => {
		if (data.order.state === OrderState.new) {
			return waitingTime < SECONDS_IN_MINUTE
				? t(
						'the order is waiting for an appointment in less than a minute'
					)
				: t('the order is waiting for an appointment {{time}}', {
						time: formatTime(waitingTime)
					});
		}

		if (data.order.state === OrderState.accepted) {
			return t('is went for package');
		}

		if (data.order.state === OrderState.delivering) {
			const progressTime =
				subRoutes.remainingRouteData?.meta.duration ?? 0;

			if (!progressTime || progressTime < NEAR_TIME) {
				return t('is near by');
			}

			return t('finish the delivery in {{time}}', {
				time: formatTime(progressTime)
			});
		}

		return t('completed the delivery');
	}, [data.order, waitingTime, subRoutes.remainingRouteData]);

	const waypoints = React.useMemo(() => {
		if (!subRoutes.plannedRouteData) {
			return;
		}
		return subRoutes.plannedRouteData.meta.waypoints.map(
			({ coordinates }, index) => ({
				coordinates,
				description:
					index === 0
						? t('Pick up the parcel')
						: t('Deliver the parcel')
			})
		);
	}, [subRoutes.plannedRouteData]);

	return (
		<Flex className={s['order-view']} vertical gap={16}>
			<Flex gap={16} justify="space-between" align="flex-start">
				<Flex vertical>
					<Typography.Title level={3}>
						{t('Order #{{id}}', { id: data.order.id })}
					</Typography.Title>
					<DeliveryType
						type={data.order.meta.deliveryType ?? 'usual'}
					/>
				</Flex>
				<Flex
					className={s['close-icon']}
					align="center"
					justify="center"
					onClick={onClose}
				>
					<CloseOutlined />
				</Flex>
			</Flex>
			<Flex vertical gap={6}>
				<Flex gap={12}>
					<OrderStatus
						text={OrderStatusTitle[data.order.state]}
						type={OrderStatusColor[data.order.state]}
					/>
					<DriverMiniCard
						name={data.driver?.name}
						avatar={data.driver?.avatar}
					/>
				</Flex>
				<Typography.Text className={s['progress-info']}>
					{progressInfo}
				</Typography.Text>
			</Flex>
			<div className={s['map']}>
				{location ? (
					<MapLayout
						location={location}
						margin={MAP_MARGIN}
						mode="vector"
					>
						{data.order ? (
							<OrderRoute
								driverCoordinates={data.driver?.position}
								orderType={data.order.type}
								orderState={data.order.state}
								meta={data.order.meta}
								subRoutes={subRoutes}
								waypoints={waypoints}
								withoutDriverPoint
								hidePastArrivalRoute={
									data.order.state !== OrderState.completed
								}
							/>
						) : null}
						{data.driver &&
						(data.order.state === OrderState.accepted ||
							data.order.state !== OrderState.completed) ? (
							<DriverMarker
								delivering
								driverId={data.driver.id}
								coordinates={data.driver.position}
								avatar={data.driver.avatar}
							/>
						) : null}
					</MapLayout>
				) : null}
			</div>
			{subRoutes.plannedRouteData ? (
				<DrivingInfoTable
					time={subRoutes.plannedRouteData.meta.duration}
					distance={subRoutes.plannedRouteData.meta.duration}
				/>
			) : null}
			<AddressesList
				addresses={data.order.waypoints.map(({ description }) => ({
					title: description
				}))}
			/>
		</Flex>
	);
};

export default OrderView;
