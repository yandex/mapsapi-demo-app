import React from 'react';
import { Outlet } from 'react-router-dom';
import cn from 'classnames';
import { t } from 'i18next';

import Layout from 'antd/lib/layout';
import Segmented from 'antd/lib/segmented';

import { Mode, MODE_OPTIONS } from '../../types';
import Toolbar from '../toolbar/toolbar';

import s from './layout.module.css';

const MODE_TITLE_MAP: Record<Mode, string> = {
	list: 'List',
	map: 'Map'
};

const ManagerLayout: React.FC = props => {
	const [mode, setMode] = React.useState<Mode>(MODE_OPTIONS[0]);

	const MODE_PICKER_OPTIONS = MODE_OPTIONS.map(value => ({
		value,
		label: (
			<div className={s['mode-option']}>{t(MODE_TITLE_MAP[value])}</div>
		)
	}));

	return (
		<Layout rootClassName={cn(s['manager-layout'], s[mode])}>
			<div className={cn(s['mode-picker'], s[mode])}>
				<Segmented
					options={MODE_PICKER_OPTIONS}
					value={mode}
					onChange={setMode}
					block
				/>
			</div>
			<Layout.Content className={s['manager-layout-content']}>
				<Outlet context={{ ...props, mode }} />
			</Layout.Content>
			<div className={s['toolbar']}>
				<Toolbar />
			</div>
		</Layout>
	);
};

export default ManagerLayout;
