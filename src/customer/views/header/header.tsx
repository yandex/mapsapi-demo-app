import React from 'react';
import { useTranslation } from 'react-i18next';

import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';

import { openDemoDialog } from '../../../common/utils/app-utils';

import s from './header.module.css';

export function Header() {
	const { t } = useTranslation();

	return (
		<div className={s.header}>
			<a href="#" onClick={openDemoDialog}>
				<ArrowLeftOutlined />
				<span>{t('Back to cart')}</span>
			</a>
		</div>
	);
}
