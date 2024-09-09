import React from 'react';

import { SizeType } from 'antd/lib/config-provider/SizeContext';
import Typography from 'antd/lib/typography';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';

import s from './loading.module.css';

const SIZE_MAP: Record<
	Exclude<SizeType, undefined>,
	React.CSSProperties | undefined
> = {
	small: { fontSize: '16px' },
	middle: { fontSize: '24px' },
	large: { fontSize: '32px' }
};

export function Loading({
	title,
	size = 'small'
}: {
	title?: string;
	size?: SizeType;
}) {
	return (
		<div className={s.loading}>
			<Typography.Text>
				<LoadingOutlined style={SIZE_MAP[size]} />
				&nbsp;{title}
			</Typography.Text>
		</div>
	);
}
