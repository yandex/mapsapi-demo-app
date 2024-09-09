import React from 'react';
import { useTranslation } from 'react-i18next';

import Flex from 'antd/lib/flex';
import List from 'antd/lib/list';
import Typography from 'antd/lib/typography';

import { language } from '../../../langs';
import { OrderStatus, OrderStatusProps } from '../order-status';

import s from './index.module.css';

export type ListItemStatusProps = {
	title: string | React.ReactNode;
	date?: Date;
	status: OrderStatusProps;
	onClick?(): void;
};

const INTL_LOCALE = language.split('_').join('-');

export function ListItemStatus(props: ListItemStatusProps) {
	const { t } = useTranslation();

	return (
		<List.Item
			style={{
				padding: 'var(--paddings-size-s) var(--paddings-size-m)',
				cursor: props.onClick ? 'pointer' : 'default'
			}}
			onClick={props.onClick}
		>
			<Flex
				align="center"
				justify="space-between"
				className={s['content']}
			>
				{typeof props.title === 'string' ? t(props.title) : props.title}
				<Flex align="center" gap="var(--paddings-size-s)">
					{props.date && (
						<Typography.Text className={s['short-date']}>
							{props.date.toLocaleString(INTL_LOCALE, {
								day: 'numeric',
								month: 'short'
							})}
						</Typography.Text>
					)}
					<OrderStatus {...props.status} />
				</Flex>
			</Flex>
		</List.Item>
	);
}
