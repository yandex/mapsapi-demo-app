import React from 'react';

import List, { ListProps } from 'antd/lib/list';

import s from './index.module.css';

export function ListLayout<Data>(props: ListProps<Data>) {
	return <List className={s['list']} {...props} />;
}
