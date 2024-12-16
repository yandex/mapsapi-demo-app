interface Request {
	method: string;
	url: string;
	body: Record<string, unknown>;
	params: Record<string, string | undefined>;
	headers: Record<string, string>;
	pathname: string;
	query: Record<string, string>;
	auth: Record<string, string | number | undefined>;
}

interface Response {
	status: number;
	body?: object | unknown[] | undefined | null;
}

interface Route {
	method: string;
	pattern: URLPattern;
	handler: (req: Request) => Promise<Response>;
}

export class Server {
	private __routes: Route[] = [];
	private __middlewares: ((req: Request) => Promise<Response | undefined>)[] =
		[];

	private async __handle(
		method: string,
		url: string,
		headers: Record<string, string>,
		body: Record<string, unknown>
	) {
		for (const route of this.__routes) {
			if (method !== route.method) continue;

			const parsed = new URL(url, location.origin);
			const match = route.pattern.exec(parsed.pathname, location.origin);
			if (!match) continue;

			const req: Request = {
				method,
				url,
				body,
				headers,
				params: match.pathname.groups,
				pathname: parsed.pathname,
				query: Object.fromEntries(parsed.searchParams.entries()),
				auth: {}
			};

			for (const middleware of this.__middlewares) {
				await middleware(req);
			}

			return await route.handler(req);
		}
		return { status: 404, body: undefined };
	}

	use(middleware: (req: Request) => Promise<Response | undefined>) {
		this.__middlewares.push(middleware);
	}

	route(
		method: 'post' | 'put' | 'get',
		pathname: string,
		handler: Route['handler']
	): void {
		this.__routes.push({
			method,
			pattern: new URLPattern({ pathname }),
			handler
		});
	}

	listen(cb: (address: string) => void) {
		window.addEventListener('message', async e => {
			if (e.data?.__type !== 'srv-req') return;

			try {
				const handled = await this.__handle(
					e.data.method.toLowerCase(),
					e.data.url,
					e.data.headers,
					e.data.body
				);
				window.postMessage({
					__type: 'srv-res',
					id: e.data.id,
					status: handled.status,
					body: handled.body
				});
			} catch (err) {
				console.error(err);
				window.postMessage({
					__type: 'srv-res',
					id: e.data.id,
					status: 500,
					body: String(err)
				});
			}
		});
		cb(location.origin);
	}

	get(pathname: string, handler: Route['handler']) {
		return this.route('get', pathname, handler);
	}

	post(pathname: string, handler: Route['handler']) {
		return this.route('post', pathname, handler);
	}

	put(pathname: string, handler: Route['handler']) {
		return this.route('put', pathname, handler);
	}
}

export const serverReady: {
	promise: Promise<unknown>;
	resolve: () => void;
	reject: (err: Error) => void;
} = (() => {
	const hooks = {} as { resolve: () => void; reject: () => void };
	const promise = new Promise((resolve, reject) =>
		Object.assign(hooks, { resolve, reject })
	);
	return { promise, ...hooks };
})();
