import React, { startTransition, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Button from 'antd/lib/button';
import Drawer from 'antd/lib/drawer';
import Tag from 'antd/lib/tag';
import Typography from 'antd/lib/typography';
import CloseOutlined from '@ant-design/icons/CloseOutlined';

import type { Pickpoint } from '../../../types';
import {
	FEATURES_LIST,
	POINT_FEATURE
} from '../pick-order-point/pick-order-point';

import s from './pick-point-info.module.css';

export function PickPointInfo({
	point,
	onClose,
	onSelectPoint,
	children
}: {
	point: Pickpoint;
	onClose: () => void;
	onSelectPoint: (point: Pickpoint) => void;
	children?: React.ReactNode;
}) {
	const { t } = useTranslation();

	const onSelect = useCallback(() => {
		startTransition(() => {
			onSelectPoint(point);
		});
	}, [point, onSelectPoint]);

	return (
		<Drawer
			open
			placement={'bottom'}
			mask={false}
			maskClosable={true}
			getContainer={false}
			autoFocus={false}
			styles={{ body: { padding: 0 } }}
		>
			<div className={s.top}>{children}</div>
			<div className={s.close}>
				<Button onClick={onClose} type={'text'}>
					<CloseOutlined />
				</Button>
			</div>
			<div className={s.info}>
				<div className={s.content}>
					<Typography.Title level={3}>{t("Pickpoint #{{id}}", { id: point.id })}</Typography.Title>
					<Typography.Text>{t(point.description)}</Typography.Text>
					<div className={s.tags}>
						{FEATURES_LIST.filter(key => point.features[key]).map(
							key => (
								<Tag key={key} className={s.tag}>
									{t(POINT_FEATURE[key])}
								</Tag>
							)
						)}
					</div>
				</div>
				<div className={s.action}>
					<Button
						onClick={onSelect}
						type={'primary'}
						block
						size={'large'}
					>
						{t('Deliver here')}
					</Button>
				</div>
			</div>
		</Drawer>
	);
}
