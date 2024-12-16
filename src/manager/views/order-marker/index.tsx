import React, { startTransition, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import ClockCircleFilled from '@ant-design/icons/ClockCircleFilled';
import ShoppingFilled from '@ant-design/icons/ShoppingFilled';

import { MapMarker } from '../../../common/lib';
import { Point } from '../../../types';
import { animate } from '../../utils/animate';

import s from './index.module.css';

export type OrderMarkerProps = {
	orderId: number;
	coordinates: Point;
	waited: boolean;
	hint: string;
};

interface Props extends OrderMarkerProps {
	onClick(orderId: number): void;
	zoom: number;
}

const iconStyle = { color: '#fff', fontSize: 14 };

const ANIMATION_DURATION = 400;

export const OrderMarker: React.FC<Props> = props => {
	const waitedClass = classNames({ [s['waited-icon']]: props.waited });
	const [coordinates, setCoordinates] = useState<Point>(
		() => props.coordinates
	);
	const prevCoordinatesRef = useRef<Point>(props.coordinates);

	useEffect(() => {
		const prevCoordinates = prevCoordinatesRef.current;
		prevCoordinatesRef.current = props.coordinates;

		const diff: Point = [
			props.coordinates[0] - prevCoordinates[0],
			props.coordinates[1] - prevCoordinates[1]
		];

		if (Math.abs(diff[0]) + Math.abs(diff[1]) < 1e-6) return;

		animate(
			progress =>
				startTransition(() => {
					setCoordinates([
						prevCoordinates[0] + diff[0] * progress,
						prevCoordinates[1] + diff[1] * progress
					]);
				}),
			ANIMATION_DURATION
		);
	}, [props.coordinates]);

	const onClick = React.useCallback(() => {
		props.onClick(props.orderId);
	}, [props.onClick, props.orderId]);

	return (
		<MapMarker coordinates={coordinates} onFastClick={onClick}>
			<div className={s['order-marker']}>
				<div className={classNames(s['icon'], waitedClass)}>
					{props.waited ? (
						<ClockCircleFilled style={iconStyle} />
					) : (
						<ShoppingFilled style={iconStyle} />
					)}
				</div>
				{props.zoom >= 12 && (
					<div className={s['hint']}>{props.hint}</div>
				)}
			</div>
		</MapMarker>
	);
};
