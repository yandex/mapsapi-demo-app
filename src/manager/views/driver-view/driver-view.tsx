import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';

import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';
import AimOutlined from '@ant-design/icons/AimOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';

import {
	useSubRoutes,
	useSubRoutesBounds
} from '../../../common/hooks/useSubRoutes';
import { MapLocationRequest, Margin } from '../../../common/lib';
import { fetchJson } from '../../../common/lib/api';
import { formatTime } from '../../../common/time/time';
import { AddressesList } from '../../../common/views/addresses-list';
import { DrivingInfoTable } from '../../../common/views/driving-info-table';
import { MapLayout } from '../../../common/views/map-layout/map-layout';
import OrderRoute from '../../../common/views/order-route';
import { OrderStatus } from '../../../common/views/order-status';
import { DriverState, OrderState } from '../../../types';
import { Driver } from '../../types';
import { getDriverStatus } from '../../utils/utils';
import { Avatar } from '../avatar';
import { DeliveryType } from '../delivery-type';
import { DriverMarker } from '../driver-marker';

import s from './driver-view.module.css';

const DRIVER_MAP_MARGIN: Margin = [70, 45, 20, 45];

interface Props {
	id: number;
	onClose(): void;
}

const DriverView: React.FC<Props> = ({ id, onClose }) => {
	const { t } = useTranslation();
	const { data } = useSuspenseQuery<Driver>({
		queryKey: ['/manager/drivers/', id],
		queryFn: async () => fetchJson(`/api/manager/drivers/${id}`),
		refetchInterval: ({ state: { data } }) =>
			data?.driver.state === DriverState.working ? 400 : false
	});

	const isOrderDelivering = React.useMemo(
		() =>
			data.order?.state === OrderState.accepted ||
			data.order?.state === OrderState.delivering,
		[data.order?.state]
	);

	const subRoutes = useSubRoutes({
		plannedQueryUrl: `/api/manager/orders/${data.order?.id}/routes/planned`,
		arrivalQueryUrl: `/api/manager/orders/${data.order?.id}/routes/arrival`,
		actualQueryUrl: `/api/manager/orders/${data.order?.id}/routes/actual`,
		remainingQueryUrl: `/api/manager/orders/${data.order?.id}/routes/remaining`,
		orderState: data.order?.state,
		enabled:
			Boolean(data.order?.id) &&
			data.order?.state !== OrderState.completed
	});

	const [location, setLocation] = React.useState<MapLocationRequest>({
		center: data.driver.position,
		zoom: 15
	});

	const bounds = useSubRoutesBounds(
		subRoutes,
		data.order?.state,
		data.driver.position
	);
	React.useEffect(() => {
		if (
			bounds &&
			(data.order?.state === OrderState.accepted ||
				data.order?.state === OrderState.delivering)
		) {
			setLocation({ bounds });
		} else if (data.driver.position) {
			setLocation({ center: data.driver.position, zoom: 15 });
		}
	}, [bounds]);

	const driverState = React.useMemo(() => {
		if (data.order?.state === OrderState.accepted) {
			return t('is went for package');
		}

		if (data.order?.state === OrderState.delivering) {
			const progressTime =
				subRoutes.remainingRouteData?.meta.duration ?? 0;

			return t('finish the delivery in {{time}}', {
				time: formatTime(progressTime)
			});
		}

		return t('awaiting order');
	}, [subRoutes.remainingRouteData, data.order?.state]);

	const waypoints = React.useMemo(() => {
		if (!subRoutes.plannedRouteData) {
			return [];
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
		<Flex className={s['driver-view']} vertical gap={16}>
			<Flex gap={16} justify="space-between" align="flex-start">
				<Flex gap={12} align="center">
					<Avatar src={data.driver.avatar} shape="square" size={48} />
					<Typography.Title level={3}>
						{data.driver.name}
					</Typography.Title>
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
				<Flex gap={12} wrap="wrap">
					<OrderStatus {...getDriverStatus(data.order)} />
					{data.order ? (
						<>
							<Typography.Text className={s['order-name']}>
								{t('Order #{{id}}', { id: data.order.id })}
							</Typography.Text>
							<DeliveryType
								type={data.order.meta.deliveryType ?? 'usual'}
							/>
						</>
					) : null}
				</Flex>
				<Typography.Text className={s['driver-state']}>
					{driverState}
				</Typography.Text>
			</Flex>
			<div className={s['map']}>
				<MapLayout
					location={location}
					margin={DRIVER_MAP_MARGIN}
					mode="vector"
				>
					{data.order && (
						<OrderRoute
							driverCoordinates={data.driver.position}
							orderType={data.order.type}
							orderState={data.order.state}
							meta={data.order.meta}
							subRoutes={subRoutes}
							waypoints={waypoints}
							withoutDriverPoint
							hidePastArrivalRoute
						/>
					)}
					{data.driver.state === 'working' &&
					!data.driver.position ? (
						<Flex
							gap={8}
							vertical
							justify="center"
							align="center"
							className={s['blur']}
						>
							<Typography.Text className={s['blur-text']}>
								{t("The driver's location is being clarified")}{' '}
								<AimOutlined
									style={{
										color: 'var(--text-text-inverted)'
									}}
								/>
							</Typography.Text>
						</Flex>
					) : (
						<DriverMarker
							delivering={isOrderDelivering}
							driverId={data.driver.id}
							coordinates={data.driver.position}
							avatar={data.driver.avatar}
						/>
					)}
				</MapLayout>
			</div>
			{subRoutes.remainingRouteData && (
				<DrivingInfoTable
					time={subRoutes.remainingRouteData.meta.duration}
					distance={subRoutes.remainingRouteData.meta.distance}
				/>
			)}
			{data.order ? (
				<AddressesList
					addresses={data.order.waypoints.map(({ description }) => ({
						title: description
					}))}
				/>
			) : null}
		</Flex>
	);
};

export default DriverView;
