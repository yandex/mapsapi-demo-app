export const OrderState = {
	/** Order is in draft. Only user can do something with it. */
	draft: 'draft',
	/** Order is created. Has proper `OrderType` and corresponding fields (origin+destanation, pickpoint, warehouse) */
	new: 'new',
	/** Order is accepted by driver. */
	accepted: 'accepted',
	/** Order is currently being delivering by driver. */
	delivering: 'delivering',
	/** Order is delivered by driver. */
	delivered: 'delivered',
	/** Order is marked by completed by user after delivery. */
	completed: 'completed'
} as const;

export const OrderType = {
	/** Delivering from origin to destination. */
	delivery: 'delivery',
	/** Delivering order to a pickpoint. */
	pickpoint: 'pickpoint',
	/** Delivering order to an address. */
	address: 'address'
} as const;

export const OrderDeliveryType = {
	/** Regular delivery */
	usual: 'usual',
	/** Express delivery */
	express: 'express',
	/** Day-to-day delivery */
	day: 'day'
} as const;

export const DriverState = {
	working: 'working',
	illness: 'illness',
	vacation: 'vacation',
	weekend: 'weekend'
} as const;

export const RouteType = {
	/** Offered driving delivery to the user. */
	driving: 'driving',
	/** Offered walking delivery to the user. */
	walking: 'walking',
	/**
	 * Route "promised" to the user. One of those.
	 * - selected by the user (`OrderType.delivery`)
	 * - build by the system (`OrderType.pickpoint`, `OrderType.address`)
	 */
	planned: 'planned',
	/** Route from the driver initial location to the pick-up point of the order. */
	arrival: 'arrival',
	/**
	 * The actual route that the driver takes.
	 * As the driver proceeds along the route, it grows.
	 *
	 * The route starts from the initial location of the driver
	 * or from the pick-up point of order if the driver hasn't reached it (for the customer).
	 *
	 * It ends at the current location of the driver.
	 */
	actual: 'actual',
	/**
	 * The rest of the route the driver will take.
	 * As the driver follows the route, it becomes shorter.
	 *
	 * The route starts from the current location of the driver
	 * or the pick-up point of the order if the driver hasn't reached it (for the customer).
	 *
	 * It ends at the destination of the order.
	 */
	remaining: 'remaining'
} as const;

export const RouteMode = {
	driving: 'driving',
	walking: 'walking'
} as const;

export type Point = [number, number];

export interface Driver {
	id: number;
	name: string;
	position: Point;
	state: keyof typeof DriverState;
	avatar?: string;
}

export interface RouteMeta {
	/** Same as `RouteData.type`. Not stored in DB, but added for easier access. */
	type: keyof typeof RouteType;

	updatedAt: string;
	price: number;
	duration: number;
	distance: number;
	waypoints: Waypoint[];
	mode: keyof typeof RouteMode;
}

// Route is already taken by react-router D:
export interface RouteData {
	type: keyof typeof RouteType;
	order_id: number;
	meta: RouteMeta;
	points: Point[];
}

export interface Waypoint {
	coordinates: Point;
	description: string;
}

export interface Order {
	id: number;
	meta: object & {
		totalAmount: number;
		products: Product[];
		/** Indicates whether order was created by autoplay. */
		autoplay?: boolean;
		/** Surge for drivers. Meaningful only for new orders. */
		surge?: number;
		/**  */
		warehouse?: number;
		pickpoint?: number;
		deliveryType?: keyof typeof OrderDeliveryType;
	};
	description: string;

	type?: keyof typeof OrderType;
	state: keyof typeof OrderState;

	waypoints: Waypoint[];
	driver_id: number | null;
	created_at: string;

	plannedRouteMeta: RouteMeta | null;
	actualRouteMeta: RouteMeta | null;
}

export interface Pickpoint {
	id: number;
	description: string;
	features: {
		card: boolean;
		return: boolean;
	};
	position: Point;
}

export type GeosuggestType =
	| 'biz'
	| 'geo'
	| 'street'
	| 'metro'
	| 'district'
	| 'locality'
	| 'area'
	| 'province'
	| 'country'
	| 'house';

type TextWithHighlight = {
	text: string;
	hl: [number, number][];
};
type Distance = {
	text: string;
	value: number;
};
export type RawSuggestItem = {
	/** Human-readable object title with matching highlighting */
	title: TextWithHighlight;
	/** Human-readable object subtitle with matching highlighting */
	subtitle?: TextWithHighlight;
	/** Distance to the object in meters */
	distance?: Distance;
	/** Additional object information that can be used in a Geocoder HTTP API request. */
	uri?: string;
	/** Object tags. Possible values: business, street, metro, district, locality, area, province, country, hydro, railway, station, route, vegetation, airport, other, house */
	tags?: string[];
};

export type SuggestItem =
	| { type: 'suggest'; item: RawSuggestItem }
	| { type: 'pickpoint'; item: Pickpoint; distance: number };

export type SuggestResult = SuggestItem[];

export interface GeocodeResult {
	name: string;
	coordinates: Point;
}

export interface Product {
	image?: string;
	title: string;
	description: string;
	price: number;
}

export interface Warehouse {
	id: number;
	position: Point;
}

interface DistanceMatrixCell {
	status: 'OK' | 'FAIL';
	distance: {
		value: number;
	};
	duration: {
		value: number;
	};
}
type DistanceMatrixRow = { elements: DistanceMatrixCell[] };
export type DistanceMatrixResponse = { rows: DistanceMatrixRow[] };

interface RawRouterStep {
	polyline: { points: Point[] };
	duration: number;
	length: number;
}
interface RawRouterLeg {
	steps: RawRouterStep[];
}
interface RawRouterRoute {
	legs: RawRouterLeg[];
}
export interface RawRouterResponse {
	route: RawRouterRoute;
}

export interface RouterResponse {
	points: Point[];
	duration: number;
	distance: number;
	mode: keyof typeof RouteMode;
}

export interface IsochroneResponse {
	hull: {
		geometry: {
			type: 'MultiPolygon';
			coordinates: Point[][][];
		};
	};
}
