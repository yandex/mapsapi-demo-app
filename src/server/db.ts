// Original sql.js package does not include the SQLite R*Tree Module (see, https://www.sqlite.org/rtree.html)
import initSqlJs from 'rtree-sql.js';

// import sqlWasm from '!!file-loader?name=sql-wasm-[contenthash].wasm!sql.js/dist/sql-wasm.wasm';

const sqljs = await initSqlJs({
	locateFile: file =>
		`https://cdn.jsdelivr.net/npm/rtree-sql.js@1.7.0/dist/${file}`
});

export const db = new sqljs.Database();
Object.assign(window, { sql });

export async function sql<T>(
	query: string,
	params?: Record<string, number | string | null>
): Promise<T[]> {
	return sql.sync<T>(query, params);
}

sql.sync = function <T>(
	query: string,
	params?: Record<string, number | string | null>
): T[] {
	let s;
	try {
		s = db.prepare(query);
		s.bind(params);
		const results = [];
		while (s.step()) {
			results.push(s.getAsObject());
		}

		return results as T[];
	} catch (e) {
		console.error(e);
		throw e;
	} finally {
		s?.reset();
		s?.free();
	}
};
