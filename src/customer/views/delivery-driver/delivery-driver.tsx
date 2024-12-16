import React from 'react';
import classNames from 'classnames';

import Avatar from 'antd/lib/avatar';
import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';
import UserOutlined from '@ant-design/icons/lib/icons/UserOutlined';
import StarFilled from '@ant-design/icons/StarFilled';

import cn from './delivery-driver.module.css';

interface Props {
	name: string;
	size: number;
	color?: string;
	vertical?: boolean;
	avatar?: string;
}

export function DeliveryDriver(props: Props) {
	return (
		<Flex
			vertical={props.vertical}
			align="center"
			gap={props.vertical ? 'var(--paddings-size-micro)' : undefined}
		>
			<Avatar
				src={props.avatar}
				size={props.size}
				shape="square"
				className={classNames(cn.avatar, { vertical: props.vertical })}
				icon={!props.avatar ? <UserOutlined /> : undefined}
			/>
			<Typography.Text
				className={classNames(
					cn['avatar-text'],
					props.color ? cn[props.color] : undefined
				)}
			>
				{props.name}{' '}
				<StarFilled
					style={{
						fontSize: 12,
						color: 'inherit'
					}}
				/>
				{' 4.7'}
			</Typography.Text>
		</Flex>
	);
}
