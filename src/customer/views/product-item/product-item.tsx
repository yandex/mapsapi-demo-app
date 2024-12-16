import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import Typography from 'antd/lib/typography';

import type { Product } from '../../../types';

import s from './product-item.module.css';

export function ProductItem({ title, description, price, image }: Product) {
	const { t } = useTranslation();

	return (
		<div className={s.product}>
			<div className={classNames(s.img, { [s.blank]: !image })}>
				{(image && (
					<img src={image} alt={title} width={132} height={132} />
				)) || <Typography.Text>{t('blank')}</Typography.Text>}
			</div>
			<div className={s.meta}>
				<div className={s.title}>
					<Typography.Text>{t(title)}</Typography.Text>
					{t('{{price, currency}}', { price })}
				</div>
				<Typography.Text className={s.description}>
					{t(description)}
				</Typography.Text>
			</div>
		</div>
	);
}
