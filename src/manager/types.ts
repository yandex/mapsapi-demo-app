import { OrderStatusType } from '../common/views/order-status';
import { Driver, DriverState, Order, OrderState } from '../types';

const MODE_OPTIONS = ['list', 'map'];
type Mode = (typeof MODE_OPTIONS)[number];

const routes = {
	orders: '/orders',
	drivers: '/drivers'
};

export interface ManagerOrderInfo extends Omit<Order, 'state'> {
	state: Exclude<keyof typeof OrderState, 'draft'>;
}

type ManagerOrderState = Exclude<keyof typeof OrderState, 'draft'>;

interface ManagerOrder {
	order: ManagerOrderInfo;
	driver?: Driver;
}

interface ManagerDriver {
	driver: Driver;
	order?: ManagerOrderInfo;
}

const OrderStatusTitle: Record<ManagerOrderState, string> = {
	new: 'Expect',
	accepted: 'Expect',
	delivering: 'On my way',
	delivered: 'Expect',
	completed: 'Completed'
};

const OrderStatusColor: Record<ManagerOrderState, OrderStatusType> = {
	new: 'warning',
	accepted: 'warning',
	delivering: 'success',
	delivered: 'success',
	completed: 'info'
};

const DriverStateTitle: Record<keyof typeof DriverState, string> = {
	working: 'Works',
	illness: 'Sick leave',
	vacation: 'Holiday',
	weekend: 'Day off'
};
export {
	ManagerDriver as Driver,
	DriverStateTitle,
	Mode,
	MODE_OPTIONS,
	ManagerOrder as Order,
	ManagerOrderState as OrderState,
	OrderStatusColor,
	OrderStatusTitle,
	OrderStatusType,
	routes
};
