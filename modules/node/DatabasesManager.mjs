import { BeastDB, SingletonCache } from 'beastdb';
import path from 'path';
import { fileURLToPath } from 'url';

import TodoDB from '../beastdb-todo/src/TodosDB.mjs';

// Get the directory name where the script is running
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbsBasePath = './dbs';

const dbs = new SingletonCache();

// Track ongoing operations to avoid concurrency issues
const dbPromises = new Map();

function parseWsUrl(url) {
    const regex = /^\/([^\/]+)\/([^\/]+)$/; // Matches /dbType/dbName
    const match = url.match(regex);
  
    if (!match) {
      throw new Error('Invalid URL format. Expected format: /dbType/dbName');
    }
  
    return {
      dbType: match[1], // Extracted dbType
      dbName: match[2]  // Extracted dbName
    };
}


async function getDatabase(url) {
    const {
        dbType,
        dbName: name
    } = parseWsUrl(url);

    console.log(dbType, name);

    // Check if the database is already being loaded/created
    if (dbPromises.has(name)) {
        return dbPromises.get(name);
    }

    const dbPromise = (async () => {
        let db = dbs.get(name);
        const dbPath = path.join(__dirname, '../', dbsBasePath, `${name}.db`);

        if (!db) {
            try {
                db = new TodoDB(dbPath);

                await db.start();
            } catch (err) {
                console.error(`Error initializing database '${name}':`, err);
                throw new Error(`Failed to initialize database ${name}`);
            }

            // Cache the database and handle cleanup when it is no longer referenced
            const storage = db.storage;
            dbs.set(name, db, () => storage.close());
        }

        return { db, dbPath };
    })();

    dbPromises.set(name, dbPromise);

    try {
        const result = await dbPromise;
        return result;
    } finally {
        // Remove the promise once resolved, so subsequent calls can work as normal
        dbPromises.delete(name);
    }
}

export { getDatabase };


export class DatabasesManager {


}

