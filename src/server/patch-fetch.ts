import { serverReady } from './lib';

// Patch fetch to work with /api/
// @ts-expect-error Its demo app
window.fetch = (() => {
	const original = window.fetch;

	return async (input: string, init) => {
		const fullUrl = new URL(input, location.origin);
		if (!fullUrl.pathname.startsWith('/api/')) {
			return original(input, init);
		}

		await serverReady.promise;

		const headers = new Headers(init?.headers);
		if (
			init?.body !== undefined &&
			headers.get('content-type') !== 'application/json'
		) {
			throw new Error(
				'fetch(/api/): content-type must be application/json'
			);
		}

		const ac = new AbortController();
		setTimeout(() => ac.abort(), 10_000);

		const url = fullUrl.pathname + fullUrl.search;

		init?.signal?.addEventListener('abort', () => ac.abort());
		init?.signal?.throwIfAborted();

		const body =
			typeof init?.body === 'string' ? JSON.parse(init?.body) : undefined;

		const method = init?.method ?? 'GET';
		const serverRes = await fetchServer({
			method,
			url,
			body,
			headers: Object.fromEntries(headers.entries()),
			signal: ac.signal
		});

		init?.signal?.throwIfAborted();

		if (serverRes.status === 499) {
			console.error(`fetch(/api/): ${url} timed out`);
		} else if (serverRes.status !== 200) {
			console.error(`fetch(/api/): ${url} => ${serverRes.status}`);
		}

		return {
			status: serverRes.status,
			json: async () => serverRes.body,
			bodyUsed: true,
			url
		};
	};
})();

let reqid = 0;
async function fetchServer({
	method,
	url,
	body,
	headers,
	signal
}: {
	method: string;
	url: string;
	body: object;
	signal: AbortSignal;
	headers: Record<string, string>;
}): Promise<{
	status: number;
	body?: object;
}> {
	const id = ++reqid;

	return new Promise(resolve => {
		signal?.throwIfAborted();

		let handler: (e: MessageEvent) => void;

		window.addEventListener(
			'message',
			(handler = e => {
				if (e.data?.__type === 'srv-res' && e.data?.id === id) {
					resolve({ status: e.data.status, body: e.data.body });
					window.removeEventListener('message', handler);
				}
			})
		);

		window.postMessage({
			__type: 'srv-req',
			id,
			method,
			url,
			headers,
			body
		});

		signal?.addEventListener('abort', () => {
			window.removeEventListener('message', handler);
			resolve({ status: 499 });
		});
	});
}
