import * as React from 'react';

interface Props<T> {
	callback: () => Promise<T>;
	onSuccess: (value: T) => void;
	interval: number;
}

export default function useAsyncInterval<T>({
	callback,
	onSuccess,
	interval
}: Props<T>) {
	const cachedFn = React.useCallback(
		() => callback().then(onSuccess),
		[onSuccess]
	);

	React.useEffect(() => {
		let timeoutId: number;
		let cancelled = false;
		const exec = () =>
			cachedFn().finally(() => {
				if (!cancelled) {
					timeoutId = window.setTimeout(exec, interval);
				}
			});

		exec();
		return () => {
			cancelled = true;
			window.clearTimeout(timeoutId);
		};
	}, [cachedFn, interval]);
}
