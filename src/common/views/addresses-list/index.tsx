import React from 'react';
import classNames from 'classnames';

import Button from 'antd/lib/button';
import ConfigProvider from 'antd/lib/config-provider';
import Divider from 'antd/lib/divider';
import Flex from 'antd/lib/flex';
import Typography from 'antd/lib/typography';

import s from './index.module.css';

export type AddressesListProps = {
	addresses: {
		title: string;
		onClick?: () => void;
	}[];
};

export function AddressesList(props: AddressesListProps) {
	return (
		<Flex className={s.list} vertical>
			<ConfigProvider wave={{ disabled: true }}>
				{props.addresses.map((address, index) => (
					<React.Fragment key={index}>
						{index !== 0 && (
							<>
								<Flex className={s.dots} vertical>
									<div
										className={classNames(s.circle, s.dot)}
									/>
									<div
										className={classNames(s.circle, s.dot)}
									/>
									<div
										className={classNames(s.circle, s.dot)}
									/>
								</Flex>
								<Divider className={s.divider} />
							</>
						)}
						<Button
							className={classNames(s.button, {
								[s['first-button']]: index === 0,
								[s['last-button']]:
									index === props.addresses.length - 1
							})}
							type="default"
							onClick={address.onClick}
						>
							<Flex className={s['button-text']} align="center">
								<span
									className={classNames(s.circle, {
										[s['circle-red']]: index === 0
									})}
								/>
								<Typography.Text ellipsis>
									{address.title}
								</Typography.Text>
							</Flex>
						</Button>
					</React.Fragment>
				))}
			</ConfigProvider>
		</Flex>
	);
}
