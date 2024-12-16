import React, { Suspense } from 'react';

import { DrawerStyles } from 'antd/es/drawer/DrawerPanel';
import AntdDrawer, { DrawerProps } from 'antd/lib/drawer';

import { Loading } from '../../../common/loading/loading';

const DRAWER_STYLES: DrawerStyles = {
    body: { padding: 'var(--paddings-size-l) 0 0', boxSizing: 'border-box' },
    content: {
        borderRadius: 'var(--radius-radius-l) var(--radius-radius-l) 0 0',
        height: 'calc(var(--layout-height) - 100px - var(--paddings-size-l))'
    }
};

type Props = Omit<DrawerProps, 'styles' | 'getContainer' | 'placement' | 'destroyOnClose'>;

const Drawer: React.FC<React.PropsWithChildren<Props>> = (props) => {
    return (
        <AntdDrawer
            {...props}
            destroyOnClose
            placement="bottom"
            getContainer={false}
            styles={DRAWER_STYLES}
            onClose={props.onClose}
            open={props.open}
        >
            <Suspense fallback={<Loading size="large" />}>
                {props.children}
            </Suspense>
        </AntdDrawer>
    )
};

export default Drawer;