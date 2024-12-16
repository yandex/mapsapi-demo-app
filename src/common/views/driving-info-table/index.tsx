import React from 'react';
import { t } from 'i18next';

import Card from 'antd/lib/card';
import Divider from 'antd/lib/divider';
import Flex from 'antd/lib/flex';

import { formatTime } from '../../../common/time/time';

import { DrivingInfoElement } from './driving-info-element';

import s from './styles.module.css';

export type DrivingInfoTableProps = {
	time: number; // in minutes
	distance: number; // in meters
	surge?: number;
};

export function DrivingInfoTable(props: DrivingInfoTableProps) {
	return (
		<Card size="small" styles={{ body: { padding: 0 } }}>
			<Flex align="center" gap="small">
				<DrivingInfoElement
					title={'time'}
					value={formatTime(props.time)}
				/>
				<Divider type="vertical" className={s.divider} />

				<DrivingInfoElement
					title={'distance'}
					value={formatDistance(props.distance)}
				/>
				<Divider type="vertical" className={s.divider} />

				{props.surge ? (
					<DrivingInfoElement
						title={'demand'}
						value={props.surge.toFixed(1)}
					/>
				) : null}
			</Flex>
		</Card>
	);
}

const unitAbbreviations = {
	meters: 'm',
	kilometers: 'km'
};

function formatDistance(distance: number) {
	const kilometers = +(distance / 1000).toFixed(2);

	if (kilometers < 1) {
		if (distance < 250) {
			return `0 ${unitAbbreviations.meters}`;
		}

		return `${Math.round(distance)} ${unitAbbreviations.meters}`;
	}

	return `${kilometers}\u00A0${t(unitAbbreviations.kilometers)}`;
}
