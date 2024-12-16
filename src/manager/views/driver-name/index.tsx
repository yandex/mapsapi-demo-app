import React from 'react';

import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';

import { Avatar } from '../avatar';

import s from './index.module.css';

interface Props {
	name?: string;
	avatar?: string;
}

export const DriverName: React.FC<Props> = (props) => {
	return (
		<Flex gap={8} vertical={false} align="center">
			<Avatar
				src={props.avatar}
				shape="square"
				size={24}
			/>
			<Typography.Text className={s['name']}>
				{props.name}
			</Typography.Text>
		</Flex>
	);
};
