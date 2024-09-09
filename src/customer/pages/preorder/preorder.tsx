import React, { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';

import { fetchJson } from '../../../common/lib/api';
import { Loading } from '../../../common/loading/loading';
import { Order } from '../../../types';

function PreOrder({ tick }: { tick: number }) {
	const { data } = useSuspenseQuery({
		queryKey: ['createOrder', tick],
		queryFn: () =>
			fetchJson<Order>('/api/user/orders', {
				method: 'post',
				body: { description: 'my order', meta: {} }
			})
		// // Don't remove For debugging purposes
		// .then(order => {
		// 	return fetchJson<Order>(
		// 		'/api/user/orders/' + order.id + '/finalize',
		// 		{
		// 			method: 'post',
		// 			body: { pickpoint: 1, type: 'pickpoint' }
		// 		}
		// 	).then(() => order);
		// })
	});

	return <Navigate to={`/order/${data?.id}`} />;
}

export function PreOrderPage() {
	const tick = Date.now();
	return (
		<Suspense fallback={<Loading />}>
			<PreOrder tick={tick} />
		</Suspense>
	);
}
