import React, {
	startTransition,
	Suspense,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import classNames from 'classnames';

import Button from 'antd/lib/button';
import Drawer from 'antd/lib/drawer';
import Segmented from 'antd/lib/segmented';
import Typography from 'antd/lib/typography';
import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';

import {
	clusterByGrid,
	ClusterFeature,
	LngLat,
	LngLatBounds,
	MapClusterer,
	type MapEventUpdateHandler,
	MapListener,
	MapLocation,
	MapMarker
} from '../../../common/lib';
import { fetchJson } from '../../../common/lib/api';
import { Loading } from '../../../common/loading/loading';
import {
	MapContext,
	MapLayout
} from '../../../common/views/map-layout/map-layout';
import { OrderMarkerCluster } from '../../../common/views/marker-cluster';
import { GeocodeResult, Pickpoint } from '../../../types';
import {
	AddressPoint,
	AddressSearch,
	PointItem
} from '../address-search/address-search';
import { PickPointInfo } from '../pick-point-info/pick-point-info';
import { PseudoInput } from '../pseudo-input/pseudo-input';
import { TooltipCenter } from '../tooltip-center/tooltip-center';

import ActivePickpoint from './assets/pin.svg';

import s from './pick-order-point.module.css';

export const POINT_FEATURE = {
	return: 'Returnable',
	card: 'Payment by card'
} as const;

type Features = keyof typeof POINT_FEATURE;

export const FEATURES_LIST = Object.keys(POINT_FEATURE) as Features[];

function Point({
	point,
	onPick,
	active
}: {
	point: Pickpoint;
	onPick?: (value: Pickpoint) => void;
	active: boolean;
}) {
	const onClick = useCallback(() => {
		onPick?.(point);
	}, [onPick, point]);

	return (
		<MapMarker
			zIndex={active ? 1000 : 1}
			onFastClick={onClick}
			coordinates={point.position}
		>
			<div
				className={classNames(s.point, {
					[s.active]: active
				})}
			>
				{active ? (
					<ActivePickpoint />
				) : (
					<PlusOutlined style={{ color: '#fff' }} />
				)}
			</div>
		</MapMarker>
	);
}

function FilterButton({
	value: key,
	strings,
	setActive
}: {
	strings: Set<Features>;
	value: Features;
	setActive: (value: React.SetStateAction<Set<Features>>) => void;
}) {
	const { t } = useTranslation();

	const onClick = useCallback(() => {
		setActive(prev => {
			const next = new Set(prev);
			if (next.has(key)) {
				next.delete(key);
			} else {
				next.add(key);
			}
			return next;
		});
	}, [key]);

	return (
		<Button
			onClick={onClick}
			type={strings.has(key) ? 'primary' : 'default'}
		>
			{t(POINT_FEATURE[key])}
		</Button>
	);
}

const GRID_CLUSTER_METHOD = clusterByGrid({ gridSize: 64 });
const MAP_DURATION = 500;

function FilteredPoints({
	activePoint,
	setActivePoint,
	points,
	onSelectPoint,
	showFilter
}: {
	activePoint: Pickpoint | null;
	setActivePoint: (value: Pickpoint | null) => void;
	points: Pickpoint[];
	onSelectPoint: (point: Pickpoint) => void;
	showFilter: boolean;
}) {
	const [active, setActive] = useState<Set<Features>>(new Set());

	const filter = showFilter && (
		<div className={s.filter}>
			{FEATURES_LIST.map(key => (
				<FilterButton
					key={key}
					strings={active}
					value={key}
					setActive={setActive}
				/>
			))}
		</div>
	);

	const onClose = useCallback(() => setActivePoint(null), []);

	const features = useMemo<ClusterFeature[]>(
		() =>
			points
				.filter(
					({ id, features }) =>
						activePoint?.id !== id &&
						(active.size === 0 ||
							Array.from(active).every(
								(key: Features) =>
									features[key] && active.has(key)
							))
				)
				.map(point => ({
					type: 'Feature',
					id: point.id.toString(),
					geometry: { type: 'Point', coordinates: point.position },
					properties: { ...point }
				})),
		[active, points, activePoint]
	);

	const marker = useCallback(
		({ properties }: ClusterFeature) => {
			const point = properties as unknown as Pickpoint;
			return (
				<Point
					active={activePoint?.id === point.id}
					key={point.id}
					point={point}
					onPick={setActivePoint}
				/>
			);
		},
		[activePoint]
	);
	const mapContext = useContext(MapContext);
	const onZoomMapByBounds = React.useCallback((bounds: LngLatBounds) => {
		mapContext.setMapProps({
			location: { bounds, duration: MAP_DURATION }
		});
	}, []);

	const cluster = React.useCallback(
		(coordinates: LngLat, features: ClusterFeature[]) => {
			const featuresCoordinates = features.map(
				feature => feature.geometry.coordinates
			);
			return (
				<OrderMarkerCluster
					key={`${features[0].id}-${features.length}`}
					coordinates={coordinates}
					onClusterClick={onZoomMapByBounds}
					featuresCoordinates={featuresCoordinates}
				/>
			);
		},
		[]
	);

	return (
		<>
			<MapClusterer
				method={GRID_CLUSTER_METHOD}
				features={features}
				marker={marker}
				cluster={cluster}
			/>

			{activePoint ? (
				<PickPointInfo
					point={activePoint}
					onClose={onClose}
					onSelectPoint={onSelectPoint}
				>
					{filter}
					<Point active key={activePoint.id} point={activePoint} />
				</PickPointInfo>
			) : (
				filter
			)}
		</>
	);
}

const PICKPOINT_MODE = 'in postamat';
const ADDRESS_MODE = 'to the address';

function Points({
	onSelectPoint,
	activePoint,
	setActivePoint,
	showFilter
}: {
	onSelectPoint: (point: Pickpoint) => void;
	activePoint: Pickpoint | null;
	setActivePoint: (value: Pickpoint | null) => void;
	showFilter: boolean;
}) {
	const { data } = useSuspenseQuery({
		queryKey: ['pickpoints'],
		queryFn: () => fetchJson<Pickpoint[]>('/api/user/pickpoints')
	});

	return (
		<FilteredPoints
			showFilter={showFilter}
			activePoint={activePoint}
			setActivePoint={setActivePoint}
			onSelectPoint={onSelectPoint}
			points={data}
		/>
	);
}

export type PickPointItem = {
	type: 'pickpoint';
	point: Pickpoint & { name: string };
};

export type AddressItem = {
	type: 'address';
	point: AddressPoint;
};

const MARGIN = [0, 0, 0, 0] as [number, number, number, number];

export function PickOrderPointDialog({
	onSelectPoint,
	onCancel,
	open
}: {
	onSelectPoint: (point: PickPointItem | AddressItem) => void;
	onCancel: () => void;
	open: boolean;
}) {
	const ref = React.useRef(null);
	const { t } = useTranslation();

	const [segment, setSegment] = useState(t(PICKPOINT_MODE));
	const [suggestMode, setSuggestMode] = useState(false);
	const [activePickpoint, setActivePickpoint] = useState<Pickpoint | null>(
		null
	);

	const onSelectPickpoint = useCallback(async (point: Pickpoint) => {
		const { name } = await fetchJson<GeocodeResult>(
			'/api/user/search?point=' + point.position.join(',')
		);
		onSelectPoint({
			type: 'pickpoint',
			point: { ...point, name }
		});
	}, []);

	const [mapLocation, setMapLocation] = useState<MapLocation | undefined>(
		undefined
	);
	const [selectedAddress, setSelectedAddress] = useState<AddressPoint | null>(
		null
	);
	const [selectedAddressDebounced, setSelectedAddressDebounced] =
		useState<AddressPoint | null>(null);

	useEffect(() => {
		fetchJson<{ center: LngLat; zoom: number }>('/api/config').then(
			async ({ center, zoom }) => {
				const point = await fetchJson<GeocodeResult>(
					'/api/user/search?point=' + center.join(',')
				);
				startTransition(() => {
					setMapLocation({
						center: point.coordinates,
						zoom
					});
					const selPoint = {
						ll: point.coordinates,
						title: point.name
					};
					setSelectedAddress(selPoint);
					setSelectedAddressDebounced(selPoint);
				});
			}
		);
	}, []);

	let timer: NodeJS.Timeout;
	const updateSelectedAddress = useCallback(
		(({ location }) => {
			const point = {
				ll: location.center,
				title: 'point.name'
			};
			startTransition(() => {
				setSelectedAddress(point);
			});

			timer && clearTimeout(timer);
			timer = setTimeout(() => {
				startTransition(() => {
					setSelectedAddressDebounced(point);
				});
			}, 300);
		}) as MapEventUpdateHandler,
		[]
	);

	const onSearchClose = useCallback(() => {
		setSuggestMode(false);
		setSelectedAddressDebounced(selectedAddress);
	}, [selectedAddress]);

	const onSearchOpen = useCallback(() => {
		setSuggestMode(true);
		setActivePickpoint(null);
		setSelectedAddressDebounced(null);
	}, []);

	const onSearch = useCallback((pointItem: PointItem) => {
		startTransition(() => {
			setSuggestMode(false);

			const isPickpoint = pointItem.type === 'pickpoint';

			setMapLocation({
				center: isPickpoint
					? pointItem.point.position
					: pointItem.point.ll,
				zoom: isPickpoint ? 18 : 16,
				// @ts-expect-error Purely for Aesthetics
				duration: 500
			});

			if (isPickpoint) {
				setActivePickpoint(pointItem.point);
			} else if (segment === ADDRESS_MODE) {
				setSelectedAddress(pointItem.point);
			}
		});
	}, []);

	return (
		<div className={classNames(s.pickpoint, { [s.open]: open })} ref={ref}>
			<div className={s.content}>
				<div className={s.tabs}>
					<Button
						type="text"
						size={'small'}
						className={s.back}
						onClick={onCancel}
					>
						<ArrowLeftOutlined />
					</Button>
					<Segmented
						value={segment}
						onChange={setSegment}
						className={s.segmented}
						options={[t(PICKPOINT_MODE), t(ADDRESS_MODE)]}
						block
					/>
				</div>

				<div className={s.map}>
					<div className={s.search}>
						<PseudoInput
							onClick={onSearchOpen}
							placeholder={t('Search address')}
							prefix={<SearchOutlined />}
						/>
					</div>
					<div className={s['map-wrapper']}>
						<MapLayout
							location={mapLocation}
							margin={mapLocation ? MARGIN : undefined}
						>
							<AddressSearch
								opened={suggestMode}
								parentRef={ref}
								onClose={onSearchClose}
								setPoint={onSearch}
								withPickpoints={segment === t(PICKPOINT_MODE)}
							/>
							<MapListener onUpdate={updateSelectedAddress} />
							{segment === t(PICKPOINT_MODE) ? (
								<Suspense fallback={<Loading />}>
									<Points
										showFilter={!suggestMode}
										setActivePoint={setActivePickpoint}
										activePoint={activePickpoint}
										onSelectPoint={onSelectPickpoint}
									/>
								</Suspense>
							) : (
								selectedAddress && (
									<>
										<TooltipCenter
											title={t('Deliver here')}
											color="#000"
										/>
										{selectedAddressDebounced && (
											<Suspense fallback={null}>
												<SelectedAddressDialog
													opened={true}
													point={
														selectedAddressDebounced
													}
													onConfirm={point => {
														onSelectPoint({
															type: 'address',
															point: point
														});
													}}
												/>
											</Suspense>
										)}
									</>
								)
							)}
						</MapLayout>
					</div>
				</div>
			</div>
		</div>
	);
}

function SelectedAddressDialog({
	opened,
	point,
	onConfirm
}: {
	opened: boolean;
	point: AddressPoint;
	onConfirm: (point: AddressPoint) => void;
}) {
	const { t } = useTranslation();

	const { isLoading, data: geoCodePoint } = useQuery({
		queryKey: ['geocode', ...point.ll],
		queryFn: () =>
			fetchJson<GeocodeResult>(
				'/api/user/search?point=' + point.ll.join(',')
			)
	});

	const onConfirmHandler = useCallback(() => {
		onConfirm({
			ll: point.ll,
			title: geoCodePoint?.name ?? ''
		});
	}, [geoCodePoint, point, onConfirm]);

	return (
		<Drawer
			open={opened}
			placement={'bottom'}
			getContainer={false}
			mask={false}
		>
			<div className={s['confirm-selected-address']}>
				{isLoading ? (
					<Loading />
				) : (
					<>
						<Typography.Title level={4}>
							{geoCodePoint?.name}
						</Typography.Title>
						<br />
						<Button
							block
							type={'primary'}
							size={'large'}
							onClick={onConfirmHandler}
						>
							{t('Confirm')}
						</Button>
					</>
				)}
			</div>
		</Drawer>
	);
}
