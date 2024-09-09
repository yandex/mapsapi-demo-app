import React from 'react';
import { useTranslation } from 'react-i18next';

import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';

import s from './styles.module.css';

type DrivingInfoElementProps = {
	title: string;
	value: string;
};

export function DrivingInfoElement(props: DrivingInfoElementProps) {
	const { t } = useTranslation();

	return (
		<Flex flex="max-content" vertical className={s.cell}>
			<Typography.Text className={s.title}>
				{t(props.title)}
			</Typography.Text>
			<Typography.Text className={s.value}>{props.value}</Typography.Text>
		</Flex>
	);
}
