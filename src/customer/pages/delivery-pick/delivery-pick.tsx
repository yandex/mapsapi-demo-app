import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
	useQuery,
	useQueryClient,
	useSuspenseQuery
} from '@tanstack/react-query';
import classNames from 'classnames';

import Button from 'antd/lib/button';
import Empty from 'antd/lib/empty';
import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';

import {
	type DomEventHandler,
	type LngLat,
	type MapEventUpdateHandler,
	MapListener,
	type MapProps,
	type Margin
} from '../../../common/lib';
import { fetchJson } from '../../../common/lib/api';
import { Loading } from '../../../common/loading/loading';
import { formatTime } from '../../../common/time/time';
import { updateLocationWithMargin } from '../../../common/utils/app-utils';
import { bbox } from '../../../common/utils/utils';
import { AddressesList } from '../../../common/views/addresses-list';
import { MapContext } from '../../../common/views/map-layout/map-layout';
import OrderPoint from '../../../common/views/order-point';
import RouteMapFeature from '../../../common/views/route-map-feature';
import { GeocodeResult, Point, RouteData, RouteMeta } from '../../../types';
import { usePoint } from '../../hooks/usePoint';
import { AddressSearch } from '../../views/address-search/address-search';
import { DeliveryContext } from '../../views/delivery-layout/delivery-layout';
import { DeliverySubmit } from '../../views/delivery-submit/delivery-submit';

import cn from './delivery-pick.module.css';

type RoutePoint = Partial<GeocodeResult>;

function pointToString(point: RoutePoint): string {
	return point.name || point.coordinates?.join(', ') || '';
}

function routeTypeToString(type: RouteMeta['type']): string {
	switch (type) {
		case 'driving':
			return 'Express';
		case 'walking':
			return 'Regular';
		default:
			return '';
	}
}

const MARGIN: Margin = [80, 80, 400, 70];

const updateLocation = (
	setMapProps: React.Dispatch<React.SetStateAction<MapProps>>,
	pointA: RoutePoint,
	pointB: RoutePoint
) => {
	const coordinates = [pointA, pointB]
		.map(point => point.coordinates)
		.filter((coordinates): coordinates is Point => Boolean(coordinates));

	if (!coordinates.length) {
		return;
	}

	const location =
		coordinates.length === 1
			? { center: coordinates[0] as LngLat, zoom: 7 }
			: { bounds: bbox(coordinates) };

	updateLocationWithMargin(setMapProps, location, MARGIN);
};

export function DeliveryPick() {
	const ref = React.useRef<HTMLElement>(null);
	const { setTootipOpen } = useOutletContext<DeliveryContext>();
	const { t } = useTranslation();
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { setMapProps } = React.useContext(MapContext);
	const [selectedType, setSelectedType] =
		React.useState<RouteMeta['type']>('driving');
	const [dragging, setDragging] = React.useState(false);

	const { data } = useSuspenseQuery({
		queryKey: ['/api/config', 'customer'],
		queryFn: async () => {
			return await fetchJson<{ center: LngLat; zoom: number }>(
				'/api/config'
			);
		}
	});
	const [pointA, setPointA] = usePoint({ coordinates: data.center as Point });
	const [pointB, setPointB] = usePoint({});

	const [suggestPoint, setSuggestPoint] = React.useState<'a' | 'b' | null>(
		null
	);
	const [submited, setSubmited] = React.useState(false);

	const isRouteSubmitable = [pointA, pointB].every(
		point => point.coordinates
	);

	const meta = useQuery({
		enabled: Boolean(isRouteSubmitable),
		queryKey: [
			`/api/user/orders/${id}/reroute`,
			...[pointA, pointB].map(point => point?.coordinates?.join(','))
		],
		queryFn: (): Promise<RouteMeta[]> => {
			return fetchJson<RouteMeta[]>(`/api/user/orders/${id}/reroute`, {
				method: 'post',
				body: {
					waypoints: [pointA.coordinates, pointB.coordinates]
				}
			});
		}
	});

	const routeUrl = `/api/user/orders/${id}/routes/${selectedType}`;
	const route = useQuery({
		enabled: Boolean(isRouteSubmitable && !meta.isFetching),
		queryKey: [
			routeUrl,
			...[pointA, pointB].map(point => point?.coordinates?.join(','))
		],
		queryFn: () => {
			return fetchJson<RouteData>(routeUrl).then(data => {
				queryClient.setQueryData(['/api/user/orders/', id, 'status'], {
					id: data.order_id,
					waypoints: data.meta.waypoints
				});
				return data;
			});
		}
	});

	const onMapUpdate: MapEventUpdateHandler = React.useCallback(
		updateObj => {
			if (!updateObj.mapInAction && !isRouteSubmitable) {
				setPointA({
					coordinates: updateObj.location.center as Point
				});
			}
		},
		[isRouteSubmitable, setPointA]
	);

	const addresses = React.useMemo(
		() => [
			{
				title: pointToString(pointA),
				onClick: () => {
					setSuggestPoint('a');
				}
			},
			{
				title: pointToString(pointB),
				onClick: () => {
					setSuggestPoint('b');
				}
			}
		],
		[pointA, pointB, setSuggestPoint]
	);

	const tooltips = React.useMemo(() => {
		return [
			{
				...pointA,
				hint: t('Pick up the parcel'),
				color: 'var(--color-route-origin)',
				change: (point: RoutePoint) => setPointA(point)
			},
			{
				...pointB,
				hint: t('Deliver the parcel'),
				color: 'var(--color-route-destination)',
				change: (point: RoutePoint) => setPointB(point)
			}
		].filter(point => Boolean(point.coordinates));
	}, [pointA, pointB]);

	React.useEffect(() => {
		updateLocationWithMargin(setMapProps, data, [0, 0, 0, 0]);
	}, [setMapProps]);

	React.useEffect(() => {
		setTootipOpen(Boolean(pointA.coordinates && !isRouteSubmitable));
		return () => {
			setTootipOpen(false);
		};
	}, [setTootipOpen, pointA.coordinates, isRouteSubmitable]);

	React.useEffect(() => {
		const types = meta.data?.map(({ type }) => type) ?? [];
		setSelectedType(selectedType =>
			types.length === 0 || types.includes(selectedType)
				? selectedType
				: types[0]
		);
	}, [meta.dataUpdatedAt, setSelectedType]);

	const onMapClick = React.useCallback(
		((_, { coordinates }) => {
			!isRouteSubmitable &&
				setPointB({
					coordinates: coordinates as Point
				});
		}) as DomEventHandler,
		[isRouteSubmitable, setPointB]
	);

	return (
		<>
			{isRouteSubmitable
				? tooltips.map(point => {
						return (
							<OrderPoint
								key={point.hint}
								title={point.hint}
								color={point.color}
								point={point.coordinates as LngLat}
								draggable
								useContainer
								onDragStart={() => {
									setDragging(true);
								}}
								onDragEnd={coordinates => {
									setDragging(false);
									point.change({
										coordinates: coordinates as Point
									});
								}}
							/>
						);
					})
				: null}
			{!suggestPoint &&
			meta.isSuccess &&
			!route.isFetching &&
			!dragging &&
			route.data ? (
				<RouteMapFeature route={route.data.points} />
			) : null}
			<MapListener onUpdate={onMapUpdate} onFastClick={onMapClick} />

			<Flex
				className={cn['delivery-pick']}
				vertical
				gap="middle"
				ref={ref}
			>
				<Flex className={cn.addresses}>
					<AddressesList addresses={addresses} />
				</Flex>
				{submited && id ? (
					<DeliverySubmit
						orderId={id}
						type={selectedType}
						onSuccess={() => navigate(`/delivery/${id}/status`)}
					/>
				) : isRouteSubmitable ? (
					<>
						<Flex
							gap="small"
							className={cn['order-meta']}
							wrap="wrap"
							align="center"
							justify="center"
						>
							{meta.isError ? (
								<Empty
									image={Empty.PRESENTED_IMAGE_SIMPLE}
									className={cn.empty}
								/>
							) : meta.isFetching || !meta.data ? (
								<Loading />
							) : (
								meta.data.map(meta => (
									<Flex
										key={meta.type}
										onClick={() =>
											setSelectedType(meta.type)
										}
										vertical
										gap="small"
										className={classNames(
											cn['order-meta-item'],
											{
												[cn[
													'order-meta-item-selected'
												]]: selectedType === meta.type
											}
										)}
									>
										<Typography.Text
											className={cn['order-meta-text']}
										>
											{t(routeTypeToString(meta.type))}
											<br />
											{formatTime(meta.duration)}
										</Typography.Text>
										<Typography.Title
											level={3}
											className={cn['order-meta-text']}
										>
											{t('{{value, currency}}', {
												value: meta.price
											})}
										</Typography.Title>
									</Flex>
								))
							)}
						</Flex>
						<Flex>
							<Button
								block
								type="primary"
								disabled={
									meta.isFetching ||
									!meta.data ||
									meta.data.length === 0
								}
								onClick={() => setSubmited(true)}
							>
								{t('Confirm')}
							</Button>
						</Flex>
					</>
				) : null}
			</Flex>

			<AddressSearch
				opened={Boolean(suggestPoint)}
				parentRef={ref}
				initialValue={
					suggestPoint === 'a'
						? pointA.name
						: suggestPoint === 'b'
							? pointB.name
							: undefined
				}
				setPoint={({ type, point }) => {
					if (type !== 'address') return;

					const routePoint = {
						name: point.title,
						coordinates: point.ll as Point
					};
					if (suggestPoint === 'a') {
						setPointA(routePoint);
						updateLocation(setMapProps, routePoint, pointB);
					}

					if (suggestPoint === 'b') {
						setPointB(routePoint);
						updateLocation(setMapProps, pointA, routePoint);
					}
				}}
				onClose={() => {
					setSuggestPoint(null);
				}}
			/>
		</>
	);
}
