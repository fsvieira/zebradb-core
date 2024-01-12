const { mkdirp } = require('mkdirp');
const {DB: beastDB} = require("beastdb");

async function getDB (path) {
    return await beastDB.open({
        storage: {
            path
        }
    });
}

async function dumpLogs (db, dest, state) {

    console.log(`Start dumping ${state} branches.`);
    const branches = await db.tables.branches;
    for await (let branch of branches.findByIndex({state})) {
        const logs = await branch.data.log;
        await logs.size;

        console.log("TODO: toArray Must Load Array!!");
        console.log(`\tDump branch : ${branch.id} , log size=${await logs.size}`);

        const messages = await logs.toArray();

        console.log(messages.join("\n"));

    }

    console.log(`End dumping ${state} branches.\n`);
}

async function main () {
    try {
        const args = process.argv;
        const [n, f, dbPath, dest] = args;
    
        if (!dest) {
            console.log(
                "Usage: dump-logs <dbPath> <dest>\n",
                "  dest is not defined!"
            );
        }
        else {
            const db = await getDB(dbPath);
            await mkdirp.sync(dest);

            await dumpLogs(db, dest, 'yes');
            await dumpLogs(db, dest, 'no');
        }
    }
    catch (e) {
        console.log(e);
    }
}

main();
  