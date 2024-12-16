import type { MouseEventHandler } from 'react';
import { t } from 'i18next';

import Modal from 'antd/lib/modal';

import type { MapLocationRequest, MapProps, Margin } from '../lib';

/**
 * Open a dialog with a message that the functionality is not implemented
 */
export const openDemoDialog = function openDemoDialog(e) {
	const container = e.currentTarget.closest('.app-layout') || document.body;

	Modal.info({
		icon: null,
		title: t('Demo App'),
		wrapClassName: 'dialog-wrapper',
		maskClosable: true,
		className: 'dialog-content',
		width: '100%',
		content: t('This functionality is not implemented in the application.'),
		okText: t("It's clear"),
		getContainer: () => container as HTMLElement,
		style: {
			position: 'absolute'
		}
	});
} as MouseEventHandler<HTMLAnchorElement>;

export function updateLocationWithMargin(
	setMapProps: React.Dispatch<React.SetStateAction<MapProps>>,
	location: MapLocationRequest,
	margin: Margin
) {
	setMapProps(mapProps => ({
		...mapProps,
		margin
	}));

	setTimeout(() => {
		setMapProps(mapProps => ({
			...mapProps,
			location
		}));
	}, 100);
}
