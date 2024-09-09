export function getHeaders(id: number | string) {
	return { authorization: `Bearer driver:${id}` };
}
