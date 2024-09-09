import React, { useRef } from 'react';

import Tooltip from 'antd/lib/tooltip';

import { LngLat, MapMarker, MapMarkerEventHandler } from '../../lib';

import s from './index.module.css';

interface Props {
	point: LngLat;
	title: React.ReactNode;
	color?: string;
	draggable?: boolean;
	useContainer?: boolean;
	onDragStart?: MapMarkerEventHandler;
	onDragEnd?: MapMarkerEventHandler;
}

const OrderPoint: React.FC<Props> = ({
	point,
	title,
	color = '#000',
	draggable,
	useContainer = true,
	onDragStart,
	onDragEnd
}) => {
	const ref = useRef<HTMLDivElement>(null);
	return (
		<MapMarker
			coordinates={point}
			zIndex={1000}
			draggable={draggable}
			onDragStart={onDragStart}
			onDragEnd={onDragEnd}
		>
			<div ref={ref}></div>
			<Tooltip
				rootClassName={s.tooltip}
				overlayInnerStyle={{
					padding: 'var(--paddings-size-s) var(--paddings-size-m)'
				}}
				placement={'top'}
				autoAdjustOverflow={false}
				getPopupContainer={
					useContainer ? () => ref.current! : undefined
				}
				open
				title={title}
				color={color}
			/>
		</MapMarker>
	);
};

export default OrderPoint;
