import { OrderStatusProps } from "../../common/views/order-status";
import { OrderState } from "../../types";
import { ManagerOrderInfo } from "../types";

function isDriverWithoutOrder(order?: ManagerOrderInfo): boolean {
    return order === undefined ||
        order.state === OrderState.completed ||
        order.state === OrderState.delivered;
}

function getDriverStatus(order?: ManagerOrderInfo): OrderStatusProps {
    const driverWithoutOrder = isDriverWithoutOrder(order);
	const text = driverWithoutOrder ? 'Free' : 'On my way';
	const type = driverWithoutOrder ? 'warning' : 'success';

    return { text, type };
}

export {getDriverStatus, isDriverWithoutOrder};
