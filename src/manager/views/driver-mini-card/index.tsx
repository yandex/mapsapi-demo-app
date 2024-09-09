import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import Typography from 'antd/lib/typography';

import { Avatar } from '../avatar';

import s from './index.module.css';

interface Props {
	name?: string;
	avatar?: string;
}

export const DriverMiniCard: React.FC<Props> = props => {
	const { t } = useTranslation();

	if (props.name === undefined) {
		return (
			<div className={classNames(s['card'], s['empty-card'])}>
				{t('The courier has not yet been assigned')}
			</div>
		);
	}
	return (
		<div className={classNames(s['card'])}>
			<Avatar shape="square" size={28} src={props.avatar} />
			<Typography.Text className={s['name']}>
				{t(props.name)}
			</Typography.Text>
		</div>
	);
};
