import React, { startTransition, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import { MapMarker } from '../../../common/lib';
import { Point } from '../../../types';
import { animate } from '../../utils/animate';
import { Avatar } from '../avatar';

import s from './index.module.css';

export type DriverMarkerProps = {
	driverId: number;
	coordinates: Point;
	delivering: boolean;
	name?: string;
	avatar?: string;
};

interface Props extends DriverMarkerProps {
	onClick?(driverId: number): void;
}

const ANIMATION_DURATION = 400;

const DriverMarker: React.FC<Props> = props => {
	const deliveringClass = classNames({ [s['delivering']]: props.delivering });

	const onClick = React.useCallback(() => {
		props.onClick?.(props.driverId);
	}, [props.onClick, props.driverId]);

	return (
		<MapMarker
			coordinates={props.coordinates}
			onFastClick={onClick}
			disableRoundCoordinates
		>
			<div className={s['driver-marker']}>
				<div className={classNames(s['avatar'], deliveringClass)}>
					<Avatar shape="circle" size={20} src={props.avatar} />
				</div>
				{props.name ? (
					<div className={s['name']}>{props.name}</div>
				) : null}
			</div>
		</MapMarker>
	);
};

type BaseComponentProps = {
	coordinates: Point;
};

function animated<T extends BaseComponentProps>(
	Component: React.FC<T>
): React.FC<T> {
	const AnimatedComponent: React.FC<T> = props => {
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

		return <Component {...props} coordinates={coordinates} />;
	};

	return AnimatedComponent;
}

const AnimatedDriverMarker = animated(DriverMarker);

export { AnimatedDriverMarker, DriverMarker };
