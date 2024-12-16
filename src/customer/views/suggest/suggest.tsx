import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSuspenseQuery } from '@tanstack/react-query';
import classnames from 'classnames';
import { useDebouncedCallback } from 'use-debounce';

import Flex from 'antd/lib/flex';
import Input, { InputRef } from 'antd/lib/input';
import List from 'antd/lib/list';
import Typography from 'antd/lib/typography';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';

import { Loading } from '../../../common/loading/loading';

import cn from './suggest.module.css';

interface ResultItem {
	title: string;
	subtitle: string;
}

interface Props<T extends ResultItem> extends SuggestProps<T> {
	value: string;
}

const SuggestResults = <T extends ResultItem>(props: Props<T>) => {
	const query = useSuspenseQuery({
		queryKey: ['suggest', props.value, props.cacheKey],
		queryFn: () => props.searchFn(props.value)
	});

	return (
		<Flex vertical className={cn['suggest-results']}>
			<List
				dataSource={query.data}
				className={cn['suggest-list']}
				renderItem={item => (
					<List.Item
						className={cn['suggest-item']}
						onClick={() => props.onClick(item)}
					>
						<Flex vertical className={cn['suggest-item']}>
							<Typography.Text
								className={classnames(cn.title, cn.text)}
								style={{ margin: 0 }}
							>
								{item.title}
							</Typography.Text>
							<Typography.Text
								color="secondary"
								className={classnames(cn.subtitle, cn.text)}
								style={{ margin: 0 }}
							>
								{item.subtitle}
							</Typography.Text>
						</Flex>
					</List.Item>
				)}
			/>
		</Flex>
	);
};

interface SuggestProps<T extends ResultItem> {
	initialValue?: string;
	searchFn: (value: string) => Promise<T[]>;
	onClick: (item: T) => void;
	onClose?: () => void;
	cacheKey: unknown;
}

const CLEAR = { clearIcon: <CloseOutlined /> };

const Suggest = <T extends ResultItem>(props: SuggestProps<T>) => {
	const { t } = useTranslation();

	const [value, setValue] = React.useState(props.initialValue ?? '');
	const ref = React.useRef<InputRef>(null);

	const onChange = useDebouncedCallback(() => {
		ref.current?.input && setValue(ref.current.input.value);
	}, 500);

	return (
		<Flex vertical className={cn.suggest}>
			<Flex gap="small" className={cn['search-row']}>
				<Input
					ref={ref}
					className={cn.input}
					defaultValue={value}
					onChange={onChange}
					prefix={<SearchOutlined />}
					size="large"
					allowClear={CLEAR}
					placeholder={t('Search address')}
					autoFocus
				/>
				{props.onClose ? (
					<Flex
						className={cn['close-icon']}
						align="center"
						justify="center"
					>
						<CloseOutlined onClick={props.onClose} />
					</Flex>
				) : null}
			</Flex>

			<React.Suspense fallback={<Loading />}>
				<SuggestResults
					value={value}
					onClick={props.onClick}
					searchFn={props.searchFn}
					cacheKey={props.cacheKey}
				/>
			</React.Suspense>
		</Flex>
	);
};

export default Suggest;
