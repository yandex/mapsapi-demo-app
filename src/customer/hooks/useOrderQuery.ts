import { useQuery } from '@tanstack/react-query';

import { fetchJson } from '../../common/lib/api';
import { CustomerOrder } from '../pages/order-view/order-view';

interface Props {
	id: string;
}

export function useOrderQuery(props: Props) {
	return useQuery({
		refetchInterval: 500,
		queryKey: ['/api/user/orders/', props.id, 'status'],
		queryFn: () => fetchJson<CustomerOrder>('/api/user/orders/' + props.id)
	});
}
