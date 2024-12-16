-- SQLite doesn't have custom types.
-- IsoTimestamp, OrderType, OrderState, DriverState, RouteType, Json, Point and Points are just TEXT

CREATE TABLE drivers (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT,
	position Point,
	state DriverState,
	avatar TEXT
);

CREATE TABLE orders (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	description TEXT,
	meta Json,
	created_at IsoTimestamp,

	type OrderType,
	state OrderState,
	products Json,

	waypoints Points,
	driver_id INTEGER,

	FOREIGN KEY(driver_id) REFERENCES drivers(id)
);

CREATE INDEX orders_type_ix ON orders (type);
CREATE INDEX orders_state_ix ON orders (state, driver_id);

CREATE TABLE drivers_declined_orders (
	driver_id INTEGER NOT NULL,
	order_id INTEGER NOT NULL,

	PRIMARY KEY (driver_id, order_id),
	FOREIGN KEY (driver_id) REFERENCES drivers(id),
	FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE tracks (
	ts INTEGER,
	driver_id INTEGER NOT NULL,
	order_id INTEGER,

	position Point,

	PRIMARY KEY (driver_id, order_id, ts),
	FOREIGN KEY (driver_id) REFERENCES drivers(id),
	FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE routes (
	type RouteType,
	order_id INTEGER NOT NULL,

	meta Json,
	points Points,

	PRIMARY KEY (order_id, type),
	FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- https://www.sqlite.org/rtree.html
CREATE VIRTUAL TABLE pickpoints USING rtree(
	id INTEGER PRIMARY KEY AUTOINCREMENT,
 	minX INTEGER,
	maxX INTEGER,
   	minY INTEGER,
	maxY INTEGER,
	-- We use auxiliary columns instead of separate index table.
	-- See https://www.sqlite.org/rtree.html#auxiliary_columns for more information
	+description TEXT,
	+features Json,
	+position Point
);
