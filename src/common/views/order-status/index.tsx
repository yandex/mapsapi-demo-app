import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import Typography from 'antd/lib/typography';

import s from './index.module.css';

export type OrderStatusType = 'warning' | 'success' | 'info';
export type OrderStatusProps = {
	text: string;
	type: OrderStatusType;
};

export function OrderStatus(props: OrderStatusProps) {
	const { t } = useTranslation();

	return (
		<Typography.Text className={classNames(s.status, s[props.type])}>
			{t(props.text)}
		</Typography.Text>
	);
}
