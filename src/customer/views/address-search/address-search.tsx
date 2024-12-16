import React, { startTransition, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import Drawer from 'antd/lib/drawer';

import { type LngLat } from '../../../common/lib';
import { fetchJson } from '../../../common/lib/api';
import { MapContext } from '../../../common/views/map-layout/map-layout';
import { Pickpoint, SuggestResult } from '../../../types';
import Suggest from '../suggest/suggest';

import cn from './address-search.module.css';

export type AddressPoint = { title: string; ll: LngLat };
export type PointItem =
	| { type: 'address'; point: AddressPoint }
	| { type: 'pickpoint'; point: Pickpoint };
const PADDING = { body: { padding: 0 } };
export function AddressSearch({
	opened,
	initialValue,
	setPoint,
	onClose,
	afterOpenChange,
	withPickpoints,
	parentRef
}: {
	opened: boolean;
	initialValue?: string;
	onClose: () => void;
	setPoint: (pointItem: PointItem) => void;
	afterOpenChange?: (open: boolean) => void;
	withPickpoints?: boolean;
	parentRef: React.RefObject<HTMLElement>;
}) {
	const ref = React.useRef<HTMLDivElement>(null);
	const { t } = useTranslation();

	const { mapRef } = useContext(MapContext);

	const searchFn = useCallback(
		(text: string) => {
			const params = new URLSearchParams({
				text,
				pickpoints: String(Boolean(withPickpoints))
			});

			if (mapRef?.current) {
				params.set(
					'bbox',
					mapRef.current.bounds
						.map(point => point.join(','))
						.join('~')
				);
			}

			return fetchJson<SuggestResult>(
				`/api/user/suggest?${params.toString()}`
			).then(res =>
				res?.map(suggestItem =>
					suggestItem.type === 'pickpoint'
						? {
								pickpoint: suggestItem.item,
								title: t('Pickpoint #{{id}}', {
									id: suggestItem.item.id
								}),
								subtitle: `${suggestItem.distance.toFixed(2)}\u00A0${t('m')}`
							}
						: {
								...suggestItem.item,
								title: suggestItem.item.title.text,
								subtitle:
									suggestItem.item.subtitle?.text ||
									suggestItem.item.distance?.text ||
									''
							}
				)
			);
		},
		[withPickpoints]
	);

	const onClick = useCallback(
		(item: { uri?: string; title: string; pickpoint?: Pickpoint }) => {
			if (item.uri) {
				fetchJson<{ coordinates: LngLat }>(
					`/api/user/search?uri=${encodeURIComponent(item.uri)}`
				).then(point => {
					const ll = point.coordinates;
					startTransition(() => {
						setPoint({
							type: 'address',
							point: { title: item.title, ll }
						});
						onClose();
					});
				});
			}

			if (item.pickpoint) {
				startTransition(() => {
					setPoint({ type: 'pickpoint', point: item.pickpoint! });
					onClose();
				});
			}
		},
		[setPoint, onClose]
	);

	return (
		<Drawer
			panelRef={ref}
			open={opened}
			placement="bottom"
			getContainer={() => parentRef.current!.closest('.app-layout')!}
			rootStyle={{ position: 'absolute', zIndex: 2000 }}
			styles={PADDING}
			destroyOnClose
			afterOpenChange={afterOpenChange}
			autoFocus={false}
			onClose={onClose}
			classNames={{ wrapper: cn.wrapper }}
		>
			<Suggest
				initialValue={initialValue}
				searchFn={searchFn}
				onClick={onClick}
				onClose={onClose}
				cacheKey={withPickpoints}
			/>
		</Drawer>
	);
}
