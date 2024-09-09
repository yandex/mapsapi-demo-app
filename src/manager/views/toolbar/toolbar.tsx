import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

import type { ThemeConfig } from 'antd/lib/config-provider';
import ConfigProvider from 'antd/lib/config-provider';
import Segmented from 'antd/lib/segmented';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

import { routes } from '../../types';

import s from './toolbar.module.css';

const customSegmentedThemeConfig: ThemeConfig = {
	token: {
		colorLink: 'var(--ant-color-text)'
	},
	components: {
		Segmented: {
			trackPadding: 'var(--paddings-size-xxs)',
			trackBg: 'var(--bg-bg-primary)',
			itemSelectedBg: 'var(--bg-bg-submerged)',
			itemActiveBg: 'var(--bg-bg-submerged)',
			itemColor: 'var(--ant-color-text)',
			itemSelectedColor: 'var(--ant-color-text)'
		}
	}
};

const TOOLBAR_ITEMS = [
	{
		value: routes.orders,
		label: 'Orders',
		icon: <ShopOutlined style={{ fontSize: '24px' }} />
	},
	{
		value: routes.drivers,
		label: 'Couriers',
		icon: <UserOutlined style={{ fontSize: '24px' }} />
	}
];

const Toolbar: React.FC = () => {
	const location = useLocation();
	const { t } = useTranslation();

	const TOOLBAR_OPTIONS = TOOLBAR_ITEMS.map(option => ({
		value: option.value,
		label: (
			<Link
				className={s['toolbar-option']}
				key={option.value}
				to={option.value}
			>
				{option.icon}
				{t(option.label)}
			</Link>
		)
	}));

	return (
		<ConfigProvider theme={customSegmentedThemeConfig}>
			<Segmented
				options={TOOLBAR_OPTIONS}
				block
				value={location.pathname}
			/>
		</ConfigProvider>
	);
};

export default Toolbar;
