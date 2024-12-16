import React from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';

import ErrorBoundary from 'antd/lib/alert/ErrorBoundary';

import s from './layout.module.css';

interface Props {
	title: string;
	visible: boolean;
}

const Layout: React.FC<React.PropsWithChildren<Props>> = ({
	children,
	title,
	visible
}) => {
	const { t } = useTranslation();
	return (
		<div className={classNames(s.layout, { [s.visible]: visible })}>
			<h4 className={s['layout-title']}>{t(title)}</h4>
			<div className={classNames(s['layout-content'], 'app-layout')}>
				<div
					className={classNames(
						s['layout-scrolled-content'],
						`${title.toLowerCase()}-app`
					)}
				>
					<ErrorBoundary description={t('Something went wrong')}>
						{children}
					</ErrorBoundary>
				</div>
			</div>
		</div>
	);
};

export default Layout;
