import React from 'react';

import AntdAvatar, { AvatarProps } from 'antd/lib/avatar';
import UserOutlined from '@ant-design/icons/UserOutlined';

type Props = {
	size: AvatarProps['size'];
	shape: AvatarProps['shape'];
	src: AvatarProps['src'];
};

export const Avatar: React.FC<Props> = props => {
	return (
		<AntdAvatar
			{...props}
			style={{
				backgroundColor: 'var(--text-text-additional)',
				border: 'none'
			}}
			icon={!props.src ? <UserOutlined /> : undefined}
		/>
	);
};
