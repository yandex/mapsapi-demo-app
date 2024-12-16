import React, { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import classNames from 'classnames';

import ConfigProvider from 'antd/lib/config-provider';

import { Loading } from '../common/loading/loading';
import Layout from '../common/views/layout/layout';

import antTheme from './ant-theme/ant-theme';
import { AppSettings } from './app-settings/app-settings';

import s from './app.module.css';

const CustomerApp = lazy(() =>
	import(/* webpackChunkName: "customerApp" */ '../customer/customer').then(
		m => ({ default: m.CustomerApp })
	)
);

const DriverApp = lazy(() =>
	import(/* webpackChunkName: "driverApp" */ '../driver/driver').then(m => ({
		default: m.DriverApp
	}))
);

const ManagerApp = lazy(() =>
	import(/* webpackChunkName: "managerApp" */ '../manager/manager').then(
		m => ({ default: m.ManagerApp })
	)
);

const queryClient = new QueryClient();

interface InstanceProps {
	className: string;
	visible: boolean;
	visibleApp: string;
}

// eslint-disable-next-line react/display-name
const Instance = React.forwardRef<HTMLDivElement, InstanceProps>((props, forwardedRef) => {
	return (
		<ConfigProvider
			theme={antTheme}
			iconPrefixCls={s.icon}
			drawer={{
				closeIcon: false,
				styles: { wrapper: { height: 'auto' } },
				style: { borderRadius: 'var(--ant-border-radius)' }
			}}
		>
			<QueryClientProvider client={queryClient}>
				<div
					ref={forwardedRef}
					className={classNames(s.app, props.className, {
						[s.visible]: props.visible
					})}
				>
					<Layout
						title="Customer"
						visible={['all', 'customer'].includes(props.visibleApp)}
					>
						<Suspense fallback={<Loading />}>
							<CustomerApp type={props.className} />
						</Suspense>
					</Layout>
					<Layout
						title="Driver"
						visible={['all', 'driver'].includes(props.visibleApp)}
					>
						<Suspense fallback={<Loading />}>
							<DriverApp />
						</Suspense>
					</Layout>
					<Layout
						title="Manager"
						visible={['all', 'manager'].includes(props.visibleApp)}
					>
						<Suspense fallback={<Loading />}>
							<ManagerApp />
						</Suspense>
					</Layout>
				</div>
			</QueryClientProvider>
		</ConfigProvider>
	);
});

export function App() {
	const [visibleInstance, setVisibleInstance] = React.useState(() =>
		window.location.search.includes('case=delivery') ? 'delivery' : 'retail'
	);
	const [visibleApp, setVisibleApp] = React.useState('all');
	const ref = React.useRef<HTMLDivElement>(null);

	const checkAppVisibility = React.useCallback(() => {
		if (!ref.current) {
			return;
		}

		const totalChildrenWidth = Array.from(ref.current.children).reduce<number>((acc, child) => {
			const styles = getComputedStyle(child);

			if (styles.display === 'none' || styles.visibility === 'hidden') {
				return acc;
			}

			return acc + child.scrollWidth + (parseFloat(styles.marginRight) ?? 0);
		}, 0);

		if (visibleApp === 'all' && totalChildrenWidth > ref.current.offsetWidth) {
			setVisibleApp('customer');
		}

		if (visibleApp !== 'all' && totalChildrenWidth * 3 <= ref.current.scrollWidth) {
			setVisibleApp('all');
		}
	}, [visibleApp]);

	React.useLayoutEffect(() => {
		checkAppVisibility();
	}, [checkAppVisibility]);

	React.useEffect(() => {
		window.addEventListener('resize', checkAppVisibility);
		return () => {
			window.removeEventListener('resize', checkAppVisibility)
		}
	}, [checkAppVisibility]);

	return (
		<ConfigProvider
			theme={antTheme}
			iconPrefixCls={s.icon}
			drawer={{
				closeIcon: false,
				styles: { wrapper: { height: 'auto' } },
				style: { borderRadius: 'var(--ant-border-radius)' }
			}}
		>
			<div className={s.platform}>
				<Instance
					className="retail"
					visible={visibleInstance === 'retail'}
					visibleApp={visibleApp}
					ref={visibleInstance === 'retail' ? ref : null}
				/>
				<Instance
					className="delivery"
					visible={visibleInstance === 'delivery'}
					visibleApp={visibleApp}
					ref={visibleInstance === 'delivery' ? ref : null}
				/>
				<AppSettings
					visibleInstance={visibleInstance}
					visibleApp={visibleApp}
					setVisibleInstance={setVisibleInstance}
					setVisibleApp={setVisibleApp}
				/>
			</div>
		</ConfigProvider>
	);
}
