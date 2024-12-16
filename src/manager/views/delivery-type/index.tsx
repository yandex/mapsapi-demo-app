import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';
import FieldTimeOutlined from '@ant-design/icons/FieldTimeOutlined';

import { OrderDeliveryType } from '../../../types';

import s from './index.module.css';

export type DeliveryTypeProps = {
	type: keyof typeof OrderDeliveryType;
};

const deliveryTypeText = {
	usual: 'Regular',
	express: 'Express',
	day: 'To a day'
};

export const DeliveryType: React.FC<DeliveryTypeProps> = props => {
	const { t } = useTranslation();
	const textClass = classNames({ [s['express']]: props.type === 'express' });
	return (
		<Flex align="center" gap={4} className={s['delivery-type']}>
			<FieldTimeOutlined
				style={{ color: 'var(--text-text-secondary)' }}
			/>
			<Typography.Text className={classNames(s['text'], textClass)}>
				{t(deliveryTypeText[props.type])}
			</Typography.Text>
		</Flex>
	);
};
