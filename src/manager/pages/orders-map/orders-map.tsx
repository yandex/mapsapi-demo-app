import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';

import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';
import ShoppingOutlined from '@ant-design/icons/ShoppingOutlined';

import { MapListener, MapProps, MapZoomLocation } from '../../../common/lib';
import { bbox } from '../../../common/utils/utils';
import {
	MapContext,
	MapLayout
} from '../../../common/views/map-layout/map-layout';
import { OrderState } from '../../../types';
import { Order } from '../../types';
import { OrderMarker, OrderMarkerProps } from '../../views/order-marker';
import { OrderListResponse } from '../orders/orders';

import s from './orders-map.module.css';

const MAP_MARGIN: MapProps['margin'] = [100, 100, 100, 100];

const getMarkerProps = (items: Order[]): OrderMarkerProps[] => {
	return items
		.filter(item => item.order.state !== OrderState.completed)
		.map(({ order, driver }) => {
			const waited = order.state === OrderState.new;
			const coordinates =
				order.state === OrderState.new ||
				order.state === OrderState.accepted
					? order.waypoints[0].coordinates
					: order.state === OrderState.delivered
						? order.waypoints[1].coordinates
						: driver?.position ?? order.waypoints[0].coordinates;
			return {
				orderId: order.id,
				coordinates,
				waited,
				hint: t('Order #{{id}}', { id: order.id })
			};
		});
};

interface Props extends OrderListResponse {
	onOrderClick(orderId: number): void;
}

export const OrdersMap: React.FC<Props> = props => {
	const location = React.useMemo(() => {
		const markerProps = getMarkerProps(props.items);
		const coordinates = markerProps.map(p => p.coordinates);
		return coordinates.length === 0
			? undefined
			: coordinates.length === 1
				? { center: coordinates[0], zoom: 12 }
				: { bounds: bbox(coordinates) };
	}, []);

	const [zoom, setZoom] = useState<number | undefined>(undefined);

	const onMapUpdate = React.useCallback(
		({ location }: { location: MapZoomLocation }) => {
			setZoom(location.zoom);
		},
		[]
	);

	const displayedItems = React.useMemo(
		() =>
			props.items.filter(
				item => item.order.state !== OrderState.completed
			),
		[props.items]
	);

	return (
		<>
			{displayedItems.length === 0 && <BlurMap />}
			<MapLayout location={location} margin={MAP_MARGIN}>
				<MapListener onUpdate={onMapUpdate} />
				<OrdersMapPoints {...props} zoom={zoom} />
			</MapLayout>
		</>
	);
};

const OrdersMapPoints: React.FC<Props & { zoom?: number }> = props => {
	const map = React.useContext(MapContext);
	const markerProps = React.useMemo(
		() => getMarkerProps(props.items),
		[props.items]
	);

	return markerProps.map(marker => (
		<OrderMarker
			{...marker}
			key={marker.orderId}
			onClick={props.onOrderClick}
			zoom={props.zoom ?? (map.mapProps.location as MapZoomLocation).zoom}
		/>
	));
};

const BlurMap = () => {
	const { t } = useTranslation();
	return (
		<Flex
			gap={8}
			vertical
			justify="center"
			align="center"
			className={s['blur']}
		>
			<ShoppingOutlined className={s['icon']} />
			<Typography.Text className={s['text']}>
				{t('There are no orders')}
			</Typography.Text>
		</Flex>
	);
};
