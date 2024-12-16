import { t } from 'i18next';

const unitAbbreviations = {
	minutes: 'min',
	hours: 'h'
};

export function formatTime(time: number) {
	const rawMinutes = Math.round(time / 60);
	const hours = Math.floor(rawMinutes / 60);

	if (!hours) {
		return `${rawMinutes}\u00A0${t(unitAbbreviations.minutes)}`;
	}

	const minutes = rawMinutes % 60;

	if (!minutes) {
		return `${hours}\u00A0${t(unitAbbreviations.hours)}`;
	}

	return `${hours}\u00A0${t(unitAbbreviations.hours)}\u00A0${minutes}\u00A0${t(unitAbbreviations.minutes)}`;
}
