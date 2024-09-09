import en_US from '../.config/langs/en_US.json';
import ru_RU from '../.config/langs/ru_RU.json';

const langs = { ru_RU, en_US };

const searchParams = new URLSearchParams(window.location.search);
const searchLanguage = searchParams.get('lang') as 'en_US';
const language =
	searchLanguage in langs
		? searchLanguage
		: (process.env.defaultLanguage as 'en_US') ?? 'en_US';

export { langs, language };
