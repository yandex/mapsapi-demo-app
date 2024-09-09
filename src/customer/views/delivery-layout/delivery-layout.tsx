import React from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

import Drawer from 'antd/lib/drawer';

import { MapLayout } from '../../../common/views/map-layout/map-layout';
import { TooltipCenter } from '../tooltip-center/tooltip-center';

export interface DeliveryContext {
	setTootipOpen: (open: boolean) => void;
}

export function DeliveryLayout() {
	const { t } = useTranslation();
	const [tooltipOpen, setTootipOpen] = React.useState(false);
	return (
		<MapLayout>
			{tooltipOpen ? (
				<TooltipCenter
					title={t('Pick up the parcel')}
					color={'var(--poi-union-point)'}
				/>
			) : null}
			<Drawer
				open
				placement="bottom"
				getContainer={false}
				mask={false}
				styles={{ body: { padding: 0 } }}
			>
				<Outlet context={{ setTootipOpen }} />
			</Drawer>
		</MapLayout>
	);
}
