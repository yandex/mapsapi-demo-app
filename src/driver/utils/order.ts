import { OrderStatusProps } from '../../common/views/order-status';
import { Order } from '../../types';

export const orderStateToStatus: Record<
	Order['state'],
	OrderStatusProps | null
> = {
	draft: null,
	new: { text: 'Expect', type: 'warning' },
	accepted: { text: 'Expect', type: 'warning' },
	delivering: { text: 'In progress', type: 'success' },
	delivered: { text: 'Expect', type: 'warning' },
	completed: { text: 'Completed', type: 'info' }
};
