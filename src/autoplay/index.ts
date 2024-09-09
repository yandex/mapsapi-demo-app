import avatarClaudiusPtolemyImg from '../common/images/ClaudiusPtolemy.png'
import avatarGerardusMercatorImg from '../common/images/GerardusMercator.png'
import avatarLeonhardEulerImg from '../common/images/LeonhardEuler.png'
import { fetchJson } from '../common/lib/api';
import { getRandomPointInBbox } from '../common/utils/utils';
import { Driver, DriverState, Point } from '../types';

import { timeout } from './common';
import { autoplayDriver } from './driver';
import { autoplayOrder } from './order';

const config = await fetchJson<{ bbox: [Point, Point] }>('/api/config');

// Register drivers
const drivers = await Promise.all(
	[
		{ name: 'Gerardus Mercator', state: DriverState.working, avatar: avatarGerardusMercatorImg },
		{ name: 'Claudius Ptolemy', state: DriverState.working, avatar: avatarClaudiusPtolemyImg },
		{ name: 'Leonhard Euler', state: DriverState.working, avatar: avatarLeonhardEulerImg },
		{ name: 'Emilio Estevise', state: DriverState.weekend },
		{ name: 'Diogenes of Sinope', state: DriverState.vacation },
		{ name: 'Fabian Bellingshausen', state: DriverState.illness }
	].map(async driverCfg => {
		const driver = await fetchJson<Driver>('/api/driver/self', {
			method: 'POST',
			body: driverCfg
		});
		return driver;
	})
);

// Track drivers
await Promise.all(
	drivers.map(driver => {
		const position = getRandomPointInBbox(config.bbox);
		const headers = { authorization: `Bearer driver:${driver.id}` };
		return fetchJson(`/api/driver/track`, {
			method: 'post',
			headers,
			body: { position }
		});
	})
);

const searchParams = new URLSearchParams(location.search);
const enable = (searchParams.get('autoplay') ?? '').split(',').filter(Boolean);
if (enable.includes('all')) enable.push('drivers', 'orders');
if (searchParams.has('autoplay-drivers')) enable.push('drivers');
if (searchParams.has('autoplay-orders')) enable.push('orders');

if (enable.includes('drivers')) {
	for (const driver of drivers) {
		if (driver.state !== DriverState.working) continue;

		(async () => {
			while (true as unknown) {
				await autoplayDriver(driver);
			}
		})();
	}
}

if (enable.includes('orders')) {
	for (let i = 0; i < 4; i++) {
		(async () => {
			while (true as unknown) {
				await timeout(Math.random() * 10_000);
				await autoplayOrder();
			}
		})();
	}
}
