export function signCurrency(value: 'ru_RU' | 'en_US') {
	switch (value) {
		case 'en_US':
			return '$';
		case 'ru_RU':
			return '₽';
		default:
			return '';
	}
}

export function formatCurrency(value: number | string) {
	if (typeof value === 'string') {
		return value;
	}

	const parts: number[] = [];

	while (value > 0) {
		parts.push(value % 1000);
		value = Math.floor(value / 1000);
	}

	return parts
		.reverse()
		.map((part, index) => {
			if (index === 0) {
				return part;
			}

			return part.toString().padStart(3, '0');
		})
		.join('\u00A0'); // &nbsp;
}
