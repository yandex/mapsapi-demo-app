import * as React from 'react';
import { useTranslation } from 'react-i18next';

import CheckOutlined from '@ant-design/icons/CheckOutlined';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';

import s from './payment-animation.module.css';

enum OrderStep {
	OrderPayment = 0,
	OrderReady = 1,
	OrderView
}

function OrderModalStep({ step }: { step: OrderStep }) {
	const { t } = useTranslation();
	return (
		<div className={s['modal-step']}>
			<div className={s.icon}>
				{step === OrderStep.OrderPayment ? (
					<LoadingOutlined />
				) : (
					<CheckOutlined />
				)}
			</div>
			<div>
				{step === OrderStep.OrderPayment ? t('Payment') : t('Ready')}
			</div>
		</div>
	);
}

export function PaymentAnimation(props: React.PropsWithChildren) {
	const [step, setStep] = React.useState(OrderStep.OrderPayment);

	React.useEffect(() => {
		(async () => {
			if (step === OrderStep.OrderView) {
				return;
			}
			await new Promise(resolve => setTimeout(resolve, 500));
			setStep(OrderStep.OrderReady);
			await new Promise(resolve => setTimeout(resolve, 500));
			setStep(OrderStep.OrderView);
		})();
	}, []);

	if (step === OrderStep.OrderPayment || step === OrderStep.OrderReady) {
		return <OrderModalStep step={step} />;
	}

	return props.children;
}
