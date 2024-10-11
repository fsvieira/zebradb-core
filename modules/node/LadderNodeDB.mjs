import BeastDB from 'beastdb';


class LadderNodeDB extends BeastDB {

    constructor (name) {
        super({
            storage: { path: name },
            remote: new RemoteWS(
                {remoteFirst: true, remoteLast: true}
            )
        });

        this.description = {
            name: this.path,
            type: this.constructor.name
        };
    }

    async start () {
        await super.start();

        await this.tables.databases
            .key('name', 'version', 'type', 'hash', 'state')
            .index('name') // username.name,
            .index('version')
            .index('hash')
            .index('type')
            .index('state') // verification, published, processing, archived
            .index('deleted')
            .save();

        return this;
    }

    async close () {
        await this.remote?.disconnect();
        await super.close();
    }

    /*
    Possible Additions

        created_at / updated_at: Timestamps to keep track of when databases are added or updated.
        owner_id: If the node can manage databases for multiple users, you might need a user ID or identifier to track ownership.
        size: Track the size of the database to monitor resource consumption.
        node_id: If this database is replicated across nodes, the node ID could help in querying which node holds the database.
        replication_factor: If you’re planning to implement replication, this field could track how many copies of the database are distributed.
    */
}
