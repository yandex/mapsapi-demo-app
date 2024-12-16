import React, {
	RefObject,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef
} from 'react';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';

import ErrorBoundary from 'antd/lib/alert/ErrorBoundary';
import Tooltip from 'antd/lib/tooltip';

import { language } from '../../../langs';
import {
	type LngLat,
	Map,
	MapDefaultFeaturesLayer,
	MapDefaultSchemeLayer,
	type MapInstance,
	type MapProps
} from '../../lib';
import { fetchJson } from '../../lib/api';
import { Loading } from '../../loading/loading';

import s from './map-layout.module.css';

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type MapContextType = {
	mapProps: MapProps;
	setMapProps: React.Dispatch<React.SetStateAction<MapProps>>;
	mapRef: RefObject<MapInstance> | null;
};

const defaultContext: MapContextType = {
	mapProps: {} as MapProps,
	setMapProps: () => {},
	mapRef: null
};

export const MapContext = React.createContext<MapContextType>(defaultContext);

export function MapLayout(
	props: React.PropsWithChildren<PartialBy<MapProps, 'location'>>
) {
	return (
		<React.Suspense fallback={<Loading />}>
			<AwaitedMapLayout {...props} />
		</React.Suspense>
	);
}

function AwaitedMapLayout(
	props: React.PropsWithChildren<PartialBy<MapProps, 'location'>>
) {
	const { children, ...initialMapProps } = props;

	const { data } = useSuspenseQuery({
		queryKey: ['config'],
		queryFn: async () =>
			await fetchJson<{ center: LngLat; zoom: number }>('/api/config')
	});

	useEffect(() => {
		setMapProps({ ...props, location: props.location || data });
	}, [data, props.location, props.margin]);

	const [mapProps, setMapProps] = React.useState<MapProps>({
		...initialMapProps,
		location: data
	});

	const mapRef = useRef<MapInstance>(null);

	return (
		<MapContext.Provider value={{ mapProps, setMapProps, mapRef }}>
			<Map {...mapProps} ref={mapRef}>
				<MapDefaultSchemeLayer />
				<MapDefaultFeaturesLayer />
				{children}
			</Map>
		</MapContext.Provider>
	);
}

export function MapStaticLayout(
	props: React.PropsWithChildren<MapProps> & { point?: string }
) {
	const { t } = useTranslation();
	return (
		<React.Suspense fallback={<Loading />}>
			<ErrorBoundary description={t('Something went wrong')}>
				<AwaitedMapStaticLayout {...props} />
			</ErrorBoundary>
		</React.Suspense>
	);
}

function AwaitedMapStaticLayout(
	props: React.PropsWithChildren<MapProps> & { point?: string }
) {
	const { location } = props;
	const [tick, setTick] = React.useState(0);
	const ref = React.useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const observer = new ResizeObserver(() => setTick(tick => tick + 1));
		if (ref.current) {
			observer.observe(ref.current);
		}
		return () => observer.disconnect();
	}, []);

	if (!location) {
		throw new Error('MapLayout: static map requires location prop');
	}

	const { data: image } = useSuspenseQuery({
		queryKey: ['static-map', location, language],
		queryFn: async () => {
			const image = new Image();
			const url = new URL(String(process.env.staticApiUrl));

			if ('bounds' in location) {
				url.searchParams.set('bbox', location.bounds.join('~'));
			} else {
				const { center, zoom } = location as {
					center: LngLat;
					zoom: number;
				};
				url.searchParams.set('ll', center.join(','));
				url.searchParams.set('z', zoom.toString());
			}

			url.searchParams.set('lang', language);
			url.searchParams.set('size', '650,450'); // Max size
			url.searchParams.set('apikey', process.env.APIKEY as string);
			extendApiRequest(url, 'static-api');
			image.src = url.toString();
			await image.decode();
			return image;
		}
	});

	const style = useMemo(
		() =>
			({
				'--map-background': `url('${image.src}')`
			}) as React.CSSProperties,
		[image.src]
	);

	return (
		<div ref={ref} className={s.static} style={style}>
			{props.point && (
				<div className={s.center}>
					<div className={s['center-box']}>
						<Tooltip
							key={tick}
							title={props.point}
							open
							placement={'top'}
							autoAdjustOverflow={false}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
