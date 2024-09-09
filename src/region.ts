import { language } from './langs';
import { Point } from './types';

interface RegionConfig {
	zoom: number;
	bbox: [Point, Point];
	currencyRate: number;
}

const searchParams = new URLSearchParams(window.location.search);
const searchParamsRegion = searchParams.get('region');

const defaultRegion = process.env.defaultRegion!;
const regionByLanguage = process.env.regionByLanguage as unknown as Partial<
	Record<string, string>
>;
const regionConfigs = process.env.regions as unknown as Partial<
	Record<string, RegionConfig>
>;

const region =
	searchParamsRegion && regionConfigs[searchParamsRegion]
		? searchParamsRegion
		: regionByLanguage[language] ?? defaultRegion;
const regionConfig = regionConfigs[region] ?? regionConfigs[defaultRegion]!;
const regions = Object.keys(regionConfigs);

export { region, regionConfig, regions };
