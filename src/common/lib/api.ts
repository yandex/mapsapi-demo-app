import { rnd } from '../utils/utils';

/**
 * Fetch JSON from the server.
 */
export async function fetchJson<T>(
	url: string | URL,
	args?: {
		method?: string;
		body?: object;
		headers?: HeadersInit;
		withoutLatency?: boolean;
	}
): Promise<T> {
	const headers = new Headers(args?.headers);
	headers.set('content-type', 'application/json');

	const method = args?.method ?? 'GET';
	const body = JSON.stringify(args?.body);

	let res;
	try {
		res = await fetch(url, { method, headers, body });
	} catch (err) {
		throw new Error(`${method} ${url} => failed ${err}`);
	}

	if (!args?.withoutLatency) {
		await new Promise(r => setTimeout(r, 10 + rnd() * 300)); // Emulate network latency
	}

	if (res.status !== 200) {
		throw new Error(`${method} ${url} => ${res.status}`);
	}

	return (await res.json()) as T;
}

Object.assign(window, { fetchJson });
