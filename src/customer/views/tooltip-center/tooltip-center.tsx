import * as React from 'react';

import { Tooltip } from 'antd';

import cn from './tooltip-center.module.css';

interface Props {
	title: string;
	color: string;
}

export function TooltipCenter(props: Props) {
	const ref = React.useRef<HTMLDivElement>(null);
	return (
		<>
			<div className={cn.wrapper} ref={ref}>
				<Tooltip
					open
					{...props}
					getPopupContainer={() => ref.current!}
					className={cn.tooltip}
					placement="top"
					autoAdjustOverflow={false}
				/>
			</div>
		</>
	);
}
