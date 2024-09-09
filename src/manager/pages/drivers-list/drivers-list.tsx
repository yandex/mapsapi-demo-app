import React from 'react';
import { useTranslation } from 'react-i18next';

import Typography from 'antd/lib/typography';

import { ListItemStatus } from '../../../common/views/list-item-status';
import { ListLayout } from '../../../common/views/list-layout';
import { DriverState } from '../../../types';
import { Driver, DriverStateTitle } from '../../types';
import { DriversListItem } from '../../views/driver-list-item';
import { DriverName } from '../../views/driver-name';
import { DriverListResponse } from '../drivers/drivers';

import s from './drivers-list.module.css';

interface Props extends DriverListResponse {
	onDriverClick(driverId: number): void;
}

export const DriversList: React.FC<Props> = ({ items, onDriverClick }) => {
	const { t } = useTranslation();

	const activeDrivers: Driver[] = [];
	const unavailableDrivers: Driver[] = [];

	items.forEach(item => {
		const { state } = item.driver;
		state === DriverState.working
			? activeDrivers.push(item)
			: unavailableDrivers.push(item);
	});

	const renderActiveDriver = React.useCallback((item: Driver) => (
		<DriversListItem item={item} onClick={() => onDriverClick(item.driver.id)} />
	), [onDriverClick]);

	return (
		<div className={s['list-layout']}>
			<Typography.Title level={4} className={s['title']}>
				{t('Works today')}
			</Typography.Title>
			<ListLayout
				itemLayout="vertical"
				dataSource={activeDrivers}
				renderItem={renderActiveDriver}
			/>
			<Typography.Title level={4} className={s['title']}>
				{t('Inaccessible')}
			</Typography.Title>
			<ListLayout
				dataSource={unavailableDrivers}
				renderItem={item => (
					<ListItemStatus
						title={<DriverName name={item.driver.name} avatar={item.driver.avatar} />}
						status={{
							text: DriverStateTitle[item.driver.state],
							type: 'info'
						}}
					/>
				)}
			/>
		</div>
	);
};
