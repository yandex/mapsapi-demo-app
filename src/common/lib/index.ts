import React from 'react';
import ReactDom from 'react-dom';
import type { Feature, YMapClustererProps } from '@yandex/ymaps3-clusterer';
import type {
	DomEventHandler,
	DrawingStyle,
	LngLat,
	LngLatBounds,
	MapEventUpdateHandler,
	Margin,
	YMapLocationRequest,
	YMapMarkerEventHandler,
	YMapProps,
	YMapZoomLocation
} from '@yandex/ymaps3-types';
import * as ymaps3 from '@yandex/ymaps3-types';
import { YMapLocation } from '@yandex/ymaps3-types/imperative/YMap';
import { Geometry } from '@yandex/ymaps3-types/imperative/YMapFeature/types';
import { reactify } from '@yandex/ymaps3-types/reactify';

type MapInstance = InstanceType<typeof ymaps3.YMap>;

const reactified = reactify.bindTo(React, ReactDom);
const {
	YMap,
	YMapDefaultFeaturesLayer,
	YMapDefaultSchemeLayer,
	YMapControls,
	YMapControlButton,
	YMapMarker,
	YMapFeature,
	YMapListener,
	YMapContainer,
	YMapControl
} = reactified.module(ymaps3);

const { clusterByGrid, YMapClusterer } = await import(
	'@yandex/ymaps3-clusterer'
);

export {
	type DomEventHandler as DomEventHandler,
	type DrawingStyle as DrawingStyle,
	Geometry,
	LngLat,
	LngLatBounds,
	YMap as Map,
	ymaps3 as map,
	YMapContainer as MapContainer,
	YMapControl as MapControl,
	YMapControlButton as MapControlButton,
	YMapControls as MapControls,
	YMapDefaultFeaturesLayer as MapDefaultFeaturesLayer,
	YMapDefaultSchemeLayer as MapDefaultSchemeLayer,
	MapEventUpdateHandler,
	YMapFeature as MapFeature,
	type MapInstance,
	YMapListener as MapListener,
	YMapLocation as MapLocation,
	type YMapLocationRequest as MapLocationRequest,
	YMapMarker as MapMarker,
	type YMapMarkerEventHandler as MapMarkerEventHandler,
	YMapProps as MapProps,
	type YMapZoomLocation as MapZoomLocation,
	type Margin as Margin,
	reactified
};

// Clusterer
const YMapClustererR = reactified.entity(YMapClusterer);
export {
	clusterByGrid,
	Feature as ClusterFeature,
	YMapClustererR as MapClusterer,
	YMapClustererProps as MapClustererProps
};
