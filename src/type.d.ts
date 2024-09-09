import type { DrawingStyle, LngLat } from './common/lib';

export type Line = {
	geometry: { type: 'LineString'; coordinates: LngLat[] };
	style?: DrawingStyle | undefined;
};
export type Marker = { coordinates: LngLat; title: string };
type Button = { text: string; onClick?: () => void };
