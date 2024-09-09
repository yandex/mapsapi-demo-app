import React from 'react';

import s from './pseudo-input.module.css';

export function PseudoInput({
	onClick,
	placeholder,
	prefix
}: {
	onClick?: () => void;
	placeholder: string;
	prefix?: React.ReactNode;
}) {
	return (
		<div className={s.input} onClick={onClick}>
			<div className={s.prefix}>{prefix}</div>
			<div className={s.placeholder}>{placeholder}</div>
		</div>
	);
}
