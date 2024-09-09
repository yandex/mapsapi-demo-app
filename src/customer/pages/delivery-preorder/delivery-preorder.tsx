import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';

import { fetchJson } from '../../../common/lib/api';
import { Loading } from '../../../common/loading/loading';
import { Order } from '../../../types';

function PreOrder(props: { tick: number }) {
	const { t } = useTranslation();
	const createOrder = useSuspenseQuery({
		queryKey: ['/api/user/orders', 'create', props.tick],
		queryFn: () =>
			fetchJson<Order>('/api/user/orders', {
				method: 'post',
				body: { description: t('Package delivery'), meta: {} }
			})
	});

	return <Navigate to={`/delivery/${createOrder.data.id}/pick`} />;
}

export function DeliveryPreorder() {
	const tick = Date.now();

	return (
		<React.Suspense fallback={<Loading />}>
			<PreOrder tick={tick} />
		</React.Suspense>
	);
}
