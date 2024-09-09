import React from 'react';

import Typography from 'antd/lib/typography';

import s from './box.module.css';

export function Box({
	children,
	title
}: {
	children: React.ReactNode;
	title?: string | React.ReactNode;
}) {
	return (
		<div className={s.box}>
			{title && (
				<div className={s.title}>
					<Typography.Title level={4}>{title}</Typography.Title>
				</div>
			)}
			<div className={s.content}>{children}</div>
		</div>
	);
}
