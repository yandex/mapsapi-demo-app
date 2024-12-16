import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import Button from 'antd/lib/button';
import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';
import ArrowRightOutlined from '@ant-design/icons/ArrowRightOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';

import { LngLat, MapMarker, Margin } from '../../../common/lib';
import { Loading } from '../../../common/loading/loading';
import {
	openDemoDialog,
	updateLocationWithMargin
} from '../../../common/utils/app-utils';
import { MapContext } from '../../../common/views/map-layout/map-layout';
import { useOrderQuery } from '../../hooks/useOrderQuery';
import { DeliveryDriver } from '../../views/delivery-driver/delivery-driver';

import Pin from './pin.svg';

import cn from './delivery-complete.module.css';

const MARGIN: Margin = [15, 15, 15, 15];
const ZOOM = 15;

export function DeliveryComplete() {
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const orderQuery = useOrderQuery({ id: id! });
	const navigate = useNavigate();
	const { setMapProps } = React.useContext(MapContext);
	const center = orderQuery.data?.waypoints[1].coordinates;

	React.useEffect(() => {
		if (!center) {
			return;
		}

		updateLocationWithMargin(
			setMapProps,
			{
				center: center as LngLat,
				zoom: ZOOM
			},
			MARGIN
		);
	}, [setMapProps, center?.[0], center?.[1]]);

	return (
		<>
			{center ? (
				<MapMarker coordinates={center}>
					<div className={cn.pin}>
						<Pin />
					</div>
				</MapMarker>
			) : null}
			<Flex vertical gap="middle" className={cn['delivery-complete']}>
				<Typography.Title level={4}>
					{t('Package is delivered')}
				</Typography.Title>
				<div className={cn['order-info']}>
					{orderQuery.data ? (
						<>
							<Flex
								className={'route-info'}
								vertical
								gap={'var(--paddings-size-micro)'}
							>
								{orderQuery.data.waypoints.map(
									(waypoint, index) => (
										<Flex
											key={index}
											className={'route-point'}
											gap={'var(--paddings-size-s)'}
										>
											<Typography.Text>
												{waypoint.description}
											</Typography.Text>
											{index === 0 ? (
												<ArrowRightOutlined
													className={cn['route-icon']}
												/>
											) : null}
										</Flex>
									)
								)}
							</Flex>
							{orderQuery.data.driver ? (
								<DeliveryDriver
									name={orderQuery.data.driver.name}
									avatar={orderQuery.data.driver.avatar}
									size={24}
								/>
							) : null}
						</>
					) : (
						<Loading />
					)}
				</div>
				<Flex gap="var(--paddings-size-m)" className={cn.buttons}>
					<Button
						block
						type="default"
						size="large"
						onClick={() => navigate('/')}
						style={{ flex: 1 }}
					>
						<PlusOutlined /> {t('New delivery')}
					</Button>
					<Button
						type="default"
						size="large"
						onClick={openDemoDialog}
					>
						{t('Rate')}
					</Button>
				</Flex>
			</Flex>
		</>
	);
}
