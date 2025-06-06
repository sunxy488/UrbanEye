import { dbConnection } from "./mongoConnection.js";

const getCollectionFn = collection => {
	let _col = undefined;

	return async () => {
		if (!_col) {
			const db = await dbConnection();
			_col = await db.collection(collection);
		}

		return _col;
	};
};


export const events = getCollectionFn("events");
export const users = getCollectionFn("users");
