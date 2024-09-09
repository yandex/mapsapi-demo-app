import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import Button from 'antd/lib/button';
import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import MoreOutlined from '@ant-design/icons/MoreOutlined';
import PhoneOutlined from '@ant-design/icons/PhoneOutlined';

import {
	useSubRoutes,
	useSubRoutesBounds
} from '../../../common/hooks/useSubRoutes';
import { Margin } from '../../../common/lib';
import { fetchJson } from '../../../common/lib/api';
import { formatTime } from '../../../common/time/time';
import {
	openDemoDialog,
	updateLocationWithMargin
} from '../../../common/utils/app-utils';
import { AddressesList } from '../../../common/views/addresses-list';
import { MapContext } from '../../../common/views/map-layout/map-layout';
import OrderRoute from '../../../common/views/order-route';
import { OrderState, OrderType } from '../../../types';
import { useOrderQuery } from '../../hooks/useOrderQuery';
import { DeliveryDriver } from '../../views/delivery-driver/delivery-driver';
import { DeliveryDriverLoading } from '../../views/delivery-submit/delivery-submit';
import { CustomerOrder } from '../order-view/order-view';

import cn from './delivery-status.module.css';

const ICONS = [PhoneOutlined, MessageOutlined, MoreOutlined] as const;

const MARGIN: Margin = [100, 100, 400, 100];

const NEAR_TIME = 60;

export function DeliveryStatus() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { setMapProps } = React.useContext(MapContext);

	const { data: order } = useOrderQuery({ id: id! });

	const subRoutes = useSubRoutes({
		plannedQueryUrl: `/api/user/orders/${id}/routes/planned`,
		arrivalQueryUrl: `/api/user/orders/${id}/routes/arrival`,
		actualQueryUrl: `/api/user/orders/${id}/routes/actual?withArrival=true`,
		remainingQueryUrl: `/api/user/orders/${id}/routes/remaining?withArrival=true`,
		orderState: order?.state,
		enabled: order?.state !== OrderState.completed
	});

	const confirmDelivery = useMutation({
		mutationKey: ['/api/user/orders/', id, '/confirm'],
		mutationFn: () =>
			fetchJson<CustomerOrder>(`/api/user/orders/${id}/confirm`, {
				method: 'POST'
			}),
		onSuccess: () => navigate(`/delivery/${id}/complete`)
	});

	React.useEffect(() => {
		if (order?.state === 'delivered') {
			confirmDelivery.mutate();
		}
	}, [order?.state, id]);

	const bounds = useSubRoutesBounds(subRoutes, order?.state, order?.position);
	React.useEffect(() => {
		if (bounds) {
			updateLocationWithMargin(setMapProps, { bounds }, MARGIN);
		}
	}, [setMapProps, bounds]);

	const renderOrderStateDescription = () => {
		let progressTime = subRoutes.remainingRouteData?.meta.duration ?? 0;
		if (order?.state === OrderState.accepted) {
			progressTime -= subRoutes.plannedRouteData?.meta.duration ?? 0;

			return !progressTime || progressTime < NEAR_TIME
				? t('is went for package')
				: t('will pick up package within {{time}}', {
						time: formatTime(progressTime)
					});
		}

		if (!progressTime || progressTime < NEAR_TIME) {
			return t('is near by');
		}

		return t('will deliver package in {{time}}', {
			time: formatTime(progressTime)
		});
	};

	return (
		<>
			<Flex className={cn['delivery-status']} vertical gap="middle">
				<Flex>
					<AddressesList
						addresses={
							order?.waypoints?.map(waypoint => ({
								title: waypoint.description
							})) || []
						}
					/>
				</Flex>
				<Flex vertical className={cn.status}>
					{!order?.driver ? (
						<DeliveryDriverLoading />
					) : (
						<Flex vertical gap="small">
							<DeliveryDriver
								name={order.driver.name}
								avatar={order.driver.avatar}
								size={56}
								color="secondary"
								vertical
							/>
							<Typography.Title level={5}>
								{renderOrderStateDescription()}
							</Typography.Title>
							<Flex gap="small" justify="center">
								{ICONS.map((IconComponent, index) => (
									<Button
										key={index}
										className={cn.button}
										size="large"
										onClick={openDemoDialog}
									>
										<IconComponent className={cn.icon} />
									</Button>
								))}
							</Flex>
						</Flex>
					)}
				</Flex>
			</Flex>

			{subRoutes ? (
				<OrderRoute
					driverCoordinates={order?.position}
					subRoutes={subRoutes}
					orderType={OrderType.delivery}
					orderState={order?.state}
					hidePastArrivalRoute
				/>
			) : null}
		</>
	);
}
