// commands/dbNode.js

// import { createDatabaseNode, startDatabaseNode, stopDatabaseNode, configDatabaseNode } from '../lib/database.js';

export default function dbNodeCommands(action, options) {
    console.log("DATABASE SERVER", action, options);
    
    switch (action) {
        case 'create':
            console.log(options);
            break;
            
        case 'start':
            console.log(options);
            break;

        case 'stop':
            console.log(options);
            break;

        case 'config':
            console.log(options);
            break;

        case 'status':
            console.log(options);

            break;
        default:
            console.log('Invalid action. Use --help for a list of available commands.');
    }
}
