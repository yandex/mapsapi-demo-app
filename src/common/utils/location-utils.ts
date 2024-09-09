export const appendSearchQuery = (
	key: string,
	value: string,
	reload = false
) => {
	const url = new URL(window.location.href);
	url.searchParams.set(key, value);

	if (reload) {
		window.location.href = url.toString();
	} else {
		window.history.replaceState({}, '', url.toString());
	}
};
