import 'urlpattern-polyfill';
import './patch-fetch';

import app from './app';
import { serverReady } from './lib';

app.listen(listenUrl => {
	console.info(`Started server ${listenUrl}`);
	serverReady.resolve();
});
