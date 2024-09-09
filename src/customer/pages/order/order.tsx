import React, { startTransition, Suspense, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useSuspenseQuery } from '@tanstack/react-query';

import Button from 'antd/lib/button';
import Typography from 'antd/lib/typography';

import { fetchJson } from '../../../common/lib/api';
import { Loading } from '../../../common/loading/loading';
import { Order } from '../../../types';
import { Box } from '../../views/box/box';
import { Header } from '../../views/header/header';
import {
	AddressItem,
	PickOrderPointDialog,
	PickPointItem
} from '../../views/pick-order-point/pick-order-point';
import { ProductItem } from '../../views/product-item/product-item';

import s from './order.module.css';

function PickOrderPoint({
	pickPoint,
	setShowPickPointDialog
}: {
	pickPoint?: PickPointItem | AddressItem;
	setShowPickPointDialog: (value: boolean) => void;
}) {
	const { t } = useTranslation();
	const openPickOrderPointDialog = useCallback(() => {
		setShowPickPointDialog(true);
	}, []);

	return (
		<>
			{pickPoint?.type === 'pickpoint' && (
				<Typography.Text>
					{t(
						'to the post office #{{id}} at the address: {{address}}',
						{
							id: pickPoint.point.id,
							address: pickPoint.point.name
						}
					)}
				</Typography.Text>
			)}
			{pickPoint?.type === 'address' && (
				<Typography.Text>
					{t('at address: {{address}}', {
						address: pickPoint.point.title
					})}
				</Typography.Text>
			)}
			<Button onClick={openPickOrderPointDialog} type={'default'} block>
				{pickPoint
					? t('Change delivery address')
					: t('Choose where to deliver')}
			</Button>
		</>
	);
}

export function OrderInfo() {
	const params = useParams<{ id: string }>();
	const [pickOrderError, setPickOrderError] = useState(false);
	const [pickPoint, setPickPoint] = useState<
		PickPointItem | AddressItem | undefined
	>();
	const { t } = useTranslation();
	const [showPickPointDialog, setShowPickPointDialog] = useState(false);
	const navigate = useNavigate();

	const { data: order } = useSuspenseQuery({
		queryKey: ['orderInfo'],
		queryFn: () => fetchJson<Order>('/api/user/orders/' + params.id)
	});

	const tryOrder = useCallback(() => {
		if (!pickPoint) {
			setPickOrderError(true);
			return;
		}

		fetchJson('/api/user/orders/' + order.id + '/finalize', {
			method: 'post',
			body: {
				type: pickPoint.type,
				destination:
					pickPoint.type === 'address'
						? pickPoint.point.ll
						: undefined,
				pickpoint:
					pickPoint.type === 'pickpoint'
						? pickPoint.point.id
						: undefined
			}
		}).then(() => {
			navigate(`/order/view/${order.id}`);
		});
	}, [pickPoint]);

	const onClosePickOrderPointDialog = useCallback(() => {
		setShowPickPointDialog(false);
	}, []);

	const onSelectPoint = useCallback((point: AddressItem | PickPointItem) => {
		startTransition(() => {
			setPickOrderError(false);
			setPickPoint(point);
			setShowPickPointDialog(false);
		});
	}, []);

	return (
		<>
			<PickOrderPointDialog
				open={showPickPointDialog}
				onCancel={onClosePickOrderPointDialog}
				onSelectPoint={onSelectPoint}
			/>
			<Box title={t('Goods')}>
				{order.meta.products.map((item, index) => (
					<ProductItem {...item} key={index} />
				))}
			</Box>
			<Box title={t('Delivery')}>
				{pickOrderError && (
					<Typography.Text type={'danger'}>
						{t('Select delivery address')}
					</Typography.Text>
				)}
				<PickOrderPoint
					pickPoint={pickPoint}
					setShowPickPointDialog={setShowPickPointDialog}
				/>
			</Box>
			<Box
				title={
					<>
						<span>
							{t('Amount to be paid {{cost, currency}}', {
								cost: order.meta.totalAmount
							})}
						</span>
					</>
				}
			>
				<Button
					danger={pickOrderError}
					onClick={tryOrder}
					type={'primary'}
					size={'large'}
					block
				>
					{t('Order')}
				</Button>
			</Box>
		</>
	);
}

export function OrderPage() {
	const { t } = useTranslation();
	return (
		<>
			<Header />
			<div className={s.title}>
				<Typography.Title level={3}>
					{t('Place an order')}
				</Typography.Title>
			</div>
			<Suspense fallback={<Loading />}>
				<OrderInfo />
			</Suspense>
		</>
	);
}
