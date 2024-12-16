import React from 'react';

import s from './pseudo-drawer.module.css';

export function PseudoDrawer({ children }: { children: React.ReactNode }) {
	return <div className={s.drawer}>{children}</div>;
}
