import * as React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import capitalize from 'lodash-es/capitalize';

import Button from 'antd/lib/button';
import Drawer from 'antd/lib/drawer';
import Flex from 'antd/lib/flex';
import Segmented from 'antd/lib/segmented';
import Select from 'antd/lib/select';
import Typography from 'antd/lib/typography';
import SettingOutlined from '@ant-design/icons/SettingOutlined';

import { appendSearchQuery } from '../../common/utils/location-utils';
import { langs, language } from '../../langs';
import { region, regions } from '../../region';

import cn from './app-settings.module.css';

interface Props {
	visibleInstance: string;
	visibleApp: string;
	setVisibleInstance: (value: string) => void;
	setVisibleApp: (value: string) => void;
}

const APPS = ['Customer', 'Driver', 'Manager'];
const CASES = ['Retail', 'Delivery'];
const LANGS = Object.keys(langs).map(value => {
	const text = value.toLowerCase().split('_')[0];
	return {
		value,
		label: capitalize(text)
	};
});

export function AppSettings(props: Props) {
	const { t } = useTranslation();
	const [open, setOpen] = React.useState(false);
	return (
		<>
			<Button
				className={cn['settings-button']}
				shape="default"
				type="text"
				size="middle"
				icon={<SettingOutlined />}
				onClick={() => setOpen(true)}
				styles={{ icon: { margin: 0 } }}
			>
				<span className={cn['button-text']}>{t('Settings')}</span>
			</Button>
			<Drawer
				open={open}
				placement="left"
				onClose={() => setOpen(false)}
				getContainer={false}
				zIndex={2001}
				closable
				classNames={{ content: cn['drawer-content'] }}
				styles={{ content: { borderRadius: 0 } }}
				width=""
				rootClassName={cn.drawer}
			>
				<Flex vertical gap="middle">
					<Flex vertical gap="middle" className={classNames(cn.apps, { [cn.all]: props.visibleApp === 'all' })}>
						<Typography.Title level={3}>
							{t('Application')}
						</Typography.Title>
						<Segmented
							block
							value={props.visibleApp}
							options={APPS.map(label => ({
								label: t(label),
								value: label.toLowerCase()
							}))}
							onChange={value => {
								props.setVisibleApp(value);
								setOpen(false);
							}}
						/>
					</Flex>
					<Flex vertical gap="middle">
						<Typography.Title level={3}>
							{t('Use case')}
						</Typography.Title>
						<Segmented
							block
							value={props.visibleInstance}
							options={CASES.map(label => ({
								label: t(label),
								value: label.toLowerCase()
							}))}
							onChange={value => {
								props.setVisibleInstance(value);
								appendSearchQuery('case', value);
							}}
						/>
					</Flex>
					{LANGS.length > 1 ? (
						<Flex vertical gap="middle">
							<Typography.Title level={3}>
								{t('Language')}
							</Typography.Title>
							<Segmented
								block
								value={language}
								options={LANGS}
								onChange={value =>
									appendSearchQuery('lang', value, true)
								}
							/>
						</Flex>
					) : null}
					{regions.length > 1 ? (
						<Flex vertical gap="middle">
							<Typography.Title level={3}>
								{t('City')}
							</Typography.Title>
							<Select
								size="large"
								defaultValue={[region]}
								onSelect={value =>
									appendSearchQuery('region', value, true)
								}
								options={regions.map(value => ({
									value,
									label: capitalize(t(value))
								}))}
							/>
						</Flex>
					) : null}
				</Flex>
			</Drawer>
		</>
	);
}
