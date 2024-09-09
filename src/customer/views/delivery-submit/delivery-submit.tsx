import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';

import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';

import { fetchJson } from '../../../common/lib/api';
import { Loading } from '../../../common/loading/loading';
import { Order, OrderType } from '../../../types';
import { PaymentAnimation } from '../payment-animation/payment-animation';

import s from './delivery-submit.module.css';

interface Props {
	orderId: string;
	type: string;
	onSuccess: () => void;
	showDriverLoading?: boolean;
}

export function DeliveryDriverLoading() {
	const { t } = useTranslation();
	return (
		<Flex vertical className={s['loading']} align="center" justify="center">
			<Loading />
			<Typography.Text>
				{t('Waiting for available courier')}
			</Typography.Text>
		</Flex>
	);
}

function FinalizeOrder(props: Props) {
	const finalizeOrder = useMutation({
		mutationKey: ['route-info/create-order', props.orderId],
		mutationFn: () =>
			fetchJson<Order>(`/api/user/orders/${props.orderId}/finalize`, {
				method: 'post',
				body: {
					type: OrderType.delivery,
					selected: props.type
				}
			}),
		onSuccess: props.onSuccess
	});

	React.useEffect(() => {
		if (!finalizeOrder.data || finalizeOrder.isError) {
			finalizeOrder.mutate();
		}
	}, [finalizeOrder.isError]);

	return props.showDriverLoading ? <DeliveryDriverLoading /> : null;
}

export function DeliverySubmit(props: Props) {
	return (
		<div className={s.submit}>
			<PaymentAnimation>
				<FinalizeOrder {...props} />
			</PaymentAnimation>
		</div>
	);
}
